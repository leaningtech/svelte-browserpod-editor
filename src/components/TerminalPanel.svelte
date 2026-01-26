<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Container from './Container.svelte';
	import { getBrowserPodEditorContext } from '../context';

	export let terminalId = 'console';
	export let title = 'Terminal';
	export let icon = 'mdi:terminal';
	/** Sequential commands to run: [[executable, ...args], ...] */
	export let commands: string[][] | undefined = undefined;
	/** Whether to auto-run the commands when BrowserPod is ready */
	export let autoRun = false;
	/** Stop executing if a command fails (default: true) */
	export let stopOnError = true;

	const ctx = getBrowserPodEditorContext();

	onMount(() => {
		ctx.registerTerminal({
			id: terminalId,
			commands,
			autoRun,
			stopOnError
		});
	});

	onDestroy(() => {
		ctx.unregisterTerminal(terminalId);
	});
</script>

<Container
	{title}
	{icon}
	class="terminal-panel"
	style="flex: 1; min-height: 0"
>
	<div class="console" id={terminalId}></div>
</Container>

<style>
	.console {
		width: 100%;
		height: 100%;
		overflow: auto;
		background-color: var(--color-terminal-bg);
	}
</style>
