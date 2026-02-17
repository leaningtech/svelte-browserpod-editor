<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Container from './Container.svelte';
	import { getBrowserPodEditorContext } from '../context.ts';
	import type { TerminalTab } from '../types.ts';

	interface Props {
		/** Configuration for terminal tabs */
		tabs?: TerminalTab[];
		/** Initially active tab ID */
		activeTab?: string;
		/** Title for the container */
		title?: string;
		/** Icon for the container */
		icon?: string;
		class?: string;
	}

	let {
		tabs = [
		{ id: 'terminal', label: 'Terminal', commands: [['/npm/bin/npm.js', 'install']], autoRun: true },
	],
		activeTab = $bindable(tabs[0]?.id || ''),
		title = 'Terminal',
		icon = 'mdi:terminal',
		class: className = ''
	}: Props = $props();
	

	const ctx = getBrowserPodEditorContext();
	const { browserPodRunning } = ctx;

	// Track which lazy tabs have been started
	let startedTabs = new Set<string>();
	// Track tabs activated before pod was ready
	let pendingTabIds: string[] = $state([]);

	let contentEl: HTMLDivElement = $state();
	let resizeObserver: ResizeObserver;

	function fitTerminal(xterm: any, container: HTMLElement) {
		if (!xterm || !container) return;

		const core = xterm._core;
		const dims = core._renderService?.dimensions;
		if (!dims) return;

		const cellWidth = dims.css.cell.width;
		const cellHeight = dims.css.cell.height;
		if (!cellWidth || !cellHeight) return;

		const cols = Math.max(2, Math.floor(container.clientWidth / cellWidth));
		const rows = Math.max(1, Math.floor(container.clientHeight / cellHeight));

		if (xterm.cols !== cols || xterm.rows !== rows) {
			xterm.resize(cols, rows);
		}
	}

	onMount(() => {
		// Register all terminals
		for (const tab of tabs) {
			ctx.registerTerminal({
				id: tab.id,
				commands: tab.commands,
				autoRun: tab.autoRun ?? false,
				stopOnError: tab.stopOnError ?? true
			});
		}

		resizeObserver = new ResizeObserver(() => {
			for (const tab of tabs) {
				const terminal = ctx.getTerminal(tab.id);
				const pane = document.getElementById(tab.id);
				if (terminal?.xterm && pane) {
					fitTerminal(terminal.xterm, pane);
				}
			}
		});
		resizeObserver.observe(contentEl);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		for (const tab of tabs) {
			ctx.unregisterTerminal(tab.id);
		}
	});

	function startTab(tab: TerminalTab) {
		if (startedTabs.has(tab.id)) return;
		startedTabs.add(tab.id);
		startedTabs = startedTabs; // trigger reactivity
		ctx.runCommands(tab.id, tab.commands!, tab.stopOnError ?? true);
	}

	function handleTabClick(tab: TerminalTab) {
		activeTab = tab.id;

		// Handle lazy-start terminals
		if (tab.runOnActivate && tab.commands && tab.commands.length > 0) {
			if ($browserPodRunning) {
				startTab(tab);
			} else if (!pendingTabIds.includes(tab.id)) {
				// Mark as pending — the $effect below will start it once the pod is ready
				pendingTabIds = [...pendingTabIds, tab.id];
			}
		}
	}

	// When pod becomes ready, start any tabs that were activated while waiting
	$effect(() => {
		if ($browserPodRunning && pendingTabIds.length > 0) {
			for (const tab of tabs) {
				if (pendingTabIds.includes(tab.id) && tab.commands && tab.commands.length > 0) {
					startTab(tab);
				}
			}
			pendingTabIds = [];
		}
	});
</script>

<Container
	{title}
	{icon}
	class={className}
>
	{#snippet actions()}
		<div class="tabbed-terminal" >
			{#if tabs.length > 1}
				{#each tabs as tab}
					<button
						type="button"
						class="terminal-tab"
						class:active={activeTab === tab.id}
						onclick={() => handleTabClick(tab)}
					>
						{tab.label}
					</button>
				{/each}
			{/if}
		</div>
	{/snippet}

	<div class="terminal-content" bind:this={contentEl}>
		{#each tabs as tab}
			<div
				class="terminal-pane"
				class:active={activeTab === tab.id}
				id={tab.id}
			></div>
		{/each}
	</div>
</Container>

<style>
	.tabbed-terminal {
		display: flex;
		align-items: center;
		margin-left: auto;
	}

	.terminal-tab {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.5rem 0.75rem;
		margin-block: calc(var(--bpe-container-header-padding) * -1);
		border: none;
		background: none;
		cursor: pointer;
		transition: color 0.2s;
		color: var(--bpe-color-text-muted);
	}
	.terminal-tab:last-child {
		margin-inline-end: calc(var(--bpe-container-header-padding) * -1);
	}

	.terminal-tab:hover:not(.active) {
		color: var(--bpe-color-text);
	}

	.terminal-tab.active {
		color: var(--bpe-color-text-active);
		background-color: var(--bpe-color-tab-active);
	}

	.terminal-content {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.terminal-pane {
		background-color: var(--bpe-color-terminal-bg);
		grid-area: 1 / 1;
		border: none;
		padding-left: 0.5rem;
		overflow: hidden;
		visibility: hidden;
	}

	.terminal-pane.active {
		visibility: visible;
	}
</style>
