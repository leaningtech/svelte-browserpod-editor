<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { createBrowserPodEditorContext } from './context';
	import { BrowserPodService } from './core/BrowserPodService';
	import { loadProject, requiresVmLoading, getVmLoadConfig, extractZipBuffer } from './core/ProjectLoader';
	import type { ProjectSource } from './types';

	// Props
	export let projectSource: ProjectSource;
	export let apiKey: string;
	export let defaultFile = '';
	export let apiDomain: string | undefined = undefined;
	export let version: string | undefined = undefined;

	const dispatch = createEventDispatcher<{
		ready: { service: BrowserPodService };
		portalReady: { url: string };
		error: { type: string; message: string };
	}>();

	// Create component-local context
	const ctx = createBrowserPodEditorContext();
	const { browserPodRunning, fileSysReady, selectedFile, fileContent, portalUrl, fileTree, terminals } = ctx;

	let service: BrowserPodService | null = null;

	// Wire up context methods
	ctx.loadFile = async (filename: string) => {
		if (!service) throw new Error('Service not initialized');
		return service.loadFile(filename);
	};

	ctx.saveFile = async (filename: string, content: string) => {
		if (!service) return false;
		return service.saveFile(filename, content);
	};

	ctx.runCommand = async (terminalId: string, command: string[]) => {
		if (!service) throw new Error('Service not initialized');
		return service.runCommand(command, terminalId);
	};

	ctx.runCommands = async (terminalId: string, commands: string[][], stopOnError = true) => {
		if (!service) throw new Error('Service not initialized');
		for (const command of commands) {
			try {
				await service.runCommand(command, terminalId);
			} catch (e) {
				console.error(`Command failed: ${command.join(' ')}`, e);
				if (stopOnError) {
					throw e;
				}
			}
		}
	};

	// Subscribe to selected file changes to load content
	let unsubSelectedFile: (() => void) | null = null;

	onMount(async () => {
		// Subscribe to file selection
		unsubSelectedFile = selectedFile.subscribe(async (newFile: string) => {
			if (newFile && service) {
				try {
					const content = await service.loadFile(newFile);
					fileContent.set(content);
				} catch (e) {
					console.error('Failed to load file:', e);
				}
			}
		});

		try {
			await initializeEditor();
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e));
			dispatch('error', { type: 'init', message: error.message });
		}
	});

	onDestroy(() => {
		unsubSelectedFile?.();
		service?.destroy();
	});

	async function initializeEditor() {
		// Create BrowserPod service
		service = new BrowserPodService({
			apiKey,
			apiDomain,
			version,
			onPortal: (url) => {
				portalUrl.set(url);
				browserPodRunning.set(true);
				dispatch('portalReady', { url });
			},
			onError: (error) => {
				dispatch('error', { type: 'browserpod', message: error.message });
			}
		});

		// Boot BrowserPod (no terminal yet)
		await service.boot();

		// Wait for child components to mount and register terminals
		await tick();

		// Create terminals for each registered config
		const registeredTerminals = get(terminals);

		for (const [id, config] of registeredTerminals) {
			const el = document.getElementById(id);
			if (el) {
				const terminal = await service.createTerminal(id, el);
				// Store terminal reference in config
				config.terminal = terminal;
				terminals.update(map => {
					map.set(id, config);
					return map;
				});
			}
		}

		let project;

		// Check if we need to load via VM (for CORS-blocked sources like GitHub)
		if (requiresVmLoading(projectSource)) {
			const vmConfig = getVmLoadConfig(projectSource);
			if (!vmConfig) {
				throw new Error('Failed to get VM load config');
			}

			// Fetch zip via VM (bypasses CORS), then extract in browser
			const zipBuffer = await service.fetchUrl(vmConfig.url);
			project = await extractZipBuffer(zipBuffer, vmConfig.stripPrefix, vmConfig.subPath);
		} else {
			// Load project files directly in browser
			project = await loadProject(projectSource);
		}

		fileTree.set(project.fileTree);

		// Upload project files to BrowserPod
		await service.uploadProjectFiles(project.files);
		fileSysReady.set(true);

		// Set default file
		if (defaultFile) {
			selectedFile.set(defaultFile);
		} else if (project.files.length > 0) {
			// Auto-select first file if none specified
			const firstFile = project.files.find(f =>
				f.path.endsWith('.svelte') ||
				f.path.endsWith('.js') ||
				f.path.endsWith('.ts')
			) || project.files[0];
			selectedFile.set(firstFile.path);
		}

		dispatch('ready', { service });

		// Run commands for terminals with autoRun
		const terminalsToRun = get(terminals);

		for (const [id, config] of terminalsToRun) {
			if (config.autoRun && config.commands && config.commands.length > 0) {
				await ctx.runCommands(id, config.commands, config.stopOnError ?? true);
			}
		}
	}

	// Expose service for advanced usage
	export function getService(): BrowserPodService | null {
		return service;
	}
</script>

<slot />
