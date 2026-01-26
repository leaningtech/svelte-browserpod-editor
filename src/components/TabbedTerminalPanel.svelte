<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Container from './Container.svelte';
	import { getBrowserPodEditorContext } from '../context';
	import type { TerminalTab } from '../types';

	/** Configuration for terminal tabs */
	export let tabs: TerminalTab[] = [
		{ id: 'terminal', label: 'Terminal', commands: [['/npm/bin/npm.js', 'install']], autoRun: true },
	];

	/** Initially active tab ID */
	export let activeTab: string = tabs[0]?.id || '';

	/** Title for the container */
	export let title = 'Terminal';

	/** Icon for the container */
	export let icon = 'mdi:terminal';

	const ctx = getBrowserPodEditorContext();

	// Track which lazy tabs have been started
	let startedTabs = new Set<string>();

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
	});

	onDestroy(() => {
		for (const tab of tabs) {
			ctx.unregisterTerminal(tab.id);
		}
	});

	function handleTabClick(tab: TerminalTab) {
		activeTab = tab.id;

		// Handle lazy-start terminals
		if (tab.runOnActivate && tab.commands && tab.commands.length > 0 && !startedTabs.has(tab.id)) {
			startedTabs.add(tab.id);
			startedTabs = startedTabs; // trigger reactivity
			ctx.runCommands(tab.id, tab.commands, tab.stopOnError ?? true);
		}
	}
</script>

<Container
	{title}
	{icon}
	class="terminal-panel"
>
	<div class="tabbed-terminal" slot="actions">
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

	<div class="terminal-content">
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
		padding: 0.25rem 0.5rem;
		border: none;
		background: none;
		cursor: pointer;
		transition: color 0.2s, background-color 0.2s;
		color: var(--color-text-muted);
		border-radius: 0.25rem;
	}

	.terminal-tab:hover:not(.active) {
		color: var(--color-text);
	}

	.terminal-tab.active {
		color: var(--color-text-active);
		background-color: var(--color-tab-active);
	}

	.terminal-content {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.terminal-pane {
		background-color: var(--color-terminal-bg);
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
