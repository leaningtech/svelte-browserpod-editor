<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Container from './Container.svelte';
	import { resolveContext } from '../context.ts';
	import type { RunCommandOptions, TabRun, TerminalTab } from '../types.ts';

	interface Props {
		/** Configuration for terminal tabs */
		tabs?: TerminalTab[];
		/** Initially active tab ID */
		activeTab?: string;
		/** Title for the container */
		title?: string;
		/** Icon for the container */
		icon?: string;
		ctxId?: string;
		class?: string;
	}

	let {
		tabs = [{ id: 'terminal', label: 'Terminal' }],
		activeTab = $bindable(tabs[0]?.id || ''),
		title = 'Terminal',
		icon = 'mdi:terminal',
		ctxId = undefined,
		class: className = ''
	}: Props = $props();


	const ctx = (() => resolveContext(ctxId))();
	const { terminals } = ctx;

	function makeRunner(tabId: string): TabRun {
		return (command, args = [], options) => ctx.runCommand(tabId, command, args, options);
	}

	let contentEl: HTMLDivElement = $state(null!);
	let resizeObserver: ResizeObserver;
	let onReadyUnsubs: (() => void)[] = [];

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
			ctx.registerTerminal({ id: tab.id });

			if (tab.onReady) {
				const runner = makeRunner(tab.id);
				const unsub = terminals.subscribe(map => {
					if (map.get(tab.id)?.terminal) {
						unsub();
						tab.onReady!(runner);
					}
				});
				onReadyUnsubs.push(unsub);
			}
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
		onReadyUnsubs.forEach(u => u());
		for (const tab of tabs) {
			ctx.unregisterTerminal(tab.id);
		}
	});

	function handleTabClick(tab: TerminalTab) {
		activeTab = tab.id;
		tab.onActivate?.(makeRunner(tab.id));
	}

	/**
	 * Run a command in the specified tab's terminal (defaults to the active tab).
	 * Returns a promise that resolves when the command completes.
	 */
	export function run(command: string, args: string[] = [], options?: RunCommandOptions & { tabId?: string }): Promise<void> {
		const { tabId, ...runOptions } = options ?? {};
		return ctx.runCommand(tabId ?? activeTab, command, args, runOptions);
	}
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
