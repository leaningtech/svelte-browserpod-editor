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

	let className = '';
	export { className as class };

	const ctx = getBrowserPodEditorContext();

	let consoleEl: HTMLDivElement;
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
		ctx.registerTerminal({
			id: terminalId,
			commands,
			autoRun,
			stopOnError
		});

		resizeObserver = new ResizeObserver(() => {
			const terminal = ctx.getTerminal(terminalId);
			if (terminal?.xterm) {
				fitTerminal(terminal.xterm, consoleEl);
			}
		});
		resizeObserver.observe(consoleEl);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
		ctx.unregisterTerminal(terminalId);
	});
</script>

<Container
	{title}
	{icon}
	class={className}
>
	<div class="console" id={terminalId} bind:this={consoleEl}></div>
</Container>

<style>
	.console {
		width: 100%;
		height: 100%;
		overflow: auto;
		background-color: var(--bpe-color-terminal-bg);
	}
</style>
