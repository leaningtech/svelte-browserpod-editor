<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
	import { get } from 'svelte/store';
	import { createBrowserPodEditorContext, getOrCreateStandaloneContext } from './context.ts';
	import { BrowserPodService } from './core/BrowserPodService.ts';
	import { loadProject, requiresVmLoading, getVmLoadConfig, extractZipBuffer } from './core/ProjectLoader.ts';
	import type { ProjectSource } from './types.ts';


	interface Props {
		// Props
		projectSource: ProjectSource;
		apiKey: string;
		defaultFile?: string;
		apiDomain?: string | undefined;
		/** Share context across isolated component trees (e.g. Astro islands).
		 *  Components with the same ctxId share state without needing a common parent. */
		ctxId?: string;
		onReady?: (service: BrowserPodService) => void;
		onPortal?: ({url, port}: {url: string, port: number}) => void;
		onError?: (type: string, message: string) => void;
		children?: import('svelte').Snippet;
	}

	let {
		projectSource,
		apiKey,
		defaultFile = '',
		apiDomain = undefined,
		ctxId = undefined,
		onReady = () => {},
		onPortal = () => {},
		onError = () => {},
		children
	}: Props = $props();

	// Resolve context: by ctxId from the module-level registry, or create one via Svelte context.
	// IIFE wraps the prop reference in a closure to avoid Svelte's state_referenced_locally warning.
	const ctx = (() => {
		if (ctxId) return getOrCreateStandaloneContext(ctxId, true);
		return createBrowserPodEditorContext();
	})();
	const { browserPodRunning, fileSysReady, portalUrls, fileTree, terminals } = ctx;

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

	/** Create a terminal instance (no autoRun). */
	async function createTerminalInstance(config: import('./types.ts').TerminalConfig) {
		if (!service || config.terminal) return;
		const el = document.getElementById(config.id);
		if (!el) return;
		const terminal = await service.createTerminal(config.id, el);
		config.terminal = terminal;
		terminals.update(map => {
			map.set(config.id, config);
			return map;
		});
	}

	async function initializeEditor() {
		// Create BrowserPod service
		service = new BrowserPodService({
			apiKey,
			apiDomain,
			onPortal: ({url, port}) => {
				portalUrls.set(port, url);
				onPortal({url, port});
			},
			onError: (error) => {
				onError('browserpod', error.message);
			}
		});

		// Boot BrowserPod (no terminal yet)
		await service.boot();
		browserPodRunning.set(true);

		// After boot, enhance registerTerminal so late-arriving terminals
		// (e.g. from separate Astro islands) are created and started automatically.
		const origRegister = ctx.registerTerminal;
		ctx.registerTerminal = (config) => {
			origRegister(config);
			createTerminalInstance(config).then(() => {
				if (config.autoRun && config.commands && config.commands.length > 0) {
					ctx.runCommands(config.id, config.commands, config.stopOnError ?? true);
				}
			});
		};

		// Wait for child components to mount and register terminals
		await tick();

		// Create terminal instances for all already-registered configs
		const registeredTerminals = get(terminals);
		for (const [, config] of registeredTerminals) {
			await createTerminalInstance(config);
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

		// Run all autoRun commands in parallel (all terminals are created by now)
		const terminalsToRun = get(terminals);
		await Promise.all(
			[...terminalsToRun.values()]
				.filter(config => config.autoRun && config.commands && config.commands.length > 0)
				.map(config => ctx.runCommands(config.id, config.commands!, config.stopOnError ?? true))
		);
	}

	// Expose service for advanced usage
	export function getService(): BrowserPodService | null {
		return service;
	}
</script>

{@render children?.()}
