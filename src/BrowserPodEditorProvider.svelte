<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { createBrowserPodEditorContext } from './context';
	import { BrowserPodService } from './core/BrowserPodService';
	import { loadProject, requiresVmLoading, getVmLoadConfig, extractZipBuffer } from './core/ProjectLoader';
	import type { ProjectSource } from './types';

	
	interface Props {
		// Props
		projectSource: ProjectSource;
		apiKey: string;
		defaultFile?: string;
		apiDomain?: string | undefined;
		onReady?: (service: BrowserPodService) => void;
		onPortalReady?: (url: string) => void;
		onError?: (type: string, message: string) => void;
		children?: import('svelte').Snippet;
	}

	let {
		projectSource,
		apiKey,
		defaultFile = '',
		apiDomain = undefined,
		onReady = () => {},
		onPortalReady = () => {},
		onError = () => {},
		children
	}: Props = $props();

	// Create component-local context
	const ctx = createBrowserPodEditorContext();
	const { browserPodRunning, fileSysReady, portalUrl, fileTree, terminals } = ctx;

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

	onMount(async () => {
		try {
			await initializeEditor();
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e));
			onError('init', error.message);
		}
	});

	onDestroy(() => {
		service?.destroy();
	});

	async function initializeEditor() {
		// Create BrowserPod service
		service = new BrowserPodService({
			apiKey,
			apiDomain,
			onPortal: (url) => {
				portalUrl.set(url);
				browserPodRunning.set(true);
				onPortalReady(url);
			},
			onError: (error) => {
				onError('browserpod', error.message);
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

		// Set default file in active editor
		if (defaultFile) {
			ctx.openFileInActiveEditor(defaultFile);
		} else if (project.files.length > 0) {
			// Auto-select first file if none specified
			const firstFile = project.files.find(f =>
				f.path.endsWith('.svelte') ||
				f.path.endsWith('.js') ||
				f.path.endsWith('.ts')
			) || project.files[0];
			ctx.openFileInActiveEditor(firstFile.path);
		}

		onReady(service);

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

{@render children?.()}
