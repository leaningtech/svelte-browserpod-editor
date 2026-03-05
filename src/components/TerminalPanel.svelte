<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Container from './Container.svelte';
	import { resolveContext } from '../context.ts';
	import type { TerminalTab } from '../types.ts';

	interface Props {
		/** Configuration for terminal tabs */
		tabs?: TerminalTab[];
		/** Initially active tab ID */
		activeTab?: string;
		/** Title for the container */
		title?: string;
		ctxId?: string;
		class?: string;
	}

	let {
		tabs = [
		{ id: 'terminal', label: 'Terminal', commands: [['/npm/bin/npm.js', 'install']], autoRun: true },
	],
		activeTab = $bindable(tabs[0]?.id || ''),
		title = '',
		ctxId = undefined,
		class: className = ''
	}: Props = $props();

	const ctx = (() => resolveContext(ctxId))();
	const { browserPodRunning } = ctx;

	let startedTabs = new Set<string>();
	let pendingTabIds: string[] = $state([]);
	let contentEl: HTMLDivElement | undefined = $state();
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
		if (contentEl) resizeObserver.observe(contentEl);
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
		startedTabs = startedTabs;
		ctx.runCommands(tab.id, tab.commands!, tab.stopOnError ?? true);
	}

	function handleTabClick(tab: TerminalTab) {
		activeTab = tab.id;

		if (tab.runOnActivate && tab.commands && tab.commands.length > 0) {
			if ($browserPodRunning) {
				startTab(tab);
			} else if (!pendingTabIds.includes(tab.id)) {
				pendingTabIds = [...pendingTabIds, tab.id];
			}
		}
	}

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
	class={className}
>
	{#snippet headerInline()}
		{#if tabs.length > 1}
			<div class="terminal-tabs">
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
			</div>
		{:else if tabs.length === 1 && !title}
			<span class="terminal-single-label">{tabs[0].label}</span>
		{/if}
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
	.terminal-tabs {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.terminal-tab {
		font-size: 0.875rem;
		font-weight: 400;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		transition: color 0.2s;
		color: var(--bpe-color-text-muted);
	}

	.terminal-tab:hover:not(.active) {
		color: var(--bpe-color-text-hover);
	}

	.terminal-tab.active {
		color: var(--bpe-color-text-header);
	}

	.terminal-single-label {
		font-size: 0.875rem;
		color: var(--bpe-color-text-header);
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
