<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import BrowserPodEditorProvider from '../src/BrowserPodEditorProvider.svelte';
	import EditorPanel from '../src/components/EditorPanel.svelte';
	import PreviewPanel from '../src/components/PreviewPanel.svelte';
	import TerminalPanel from '../src/components/TerminalPanel.svelte';
	import FileTree from '../src/components/FileTree.svelte';
	import Container from '../src/components/Container.svelte';
	import Separator from '../src/components/Separator.svelte';
	import type { ProjectSource, TerminalTab } from '../src/types';

	let fileTreeOpen = $state(true);
	let fileTreeWidth = $state(180);
	let isResizingTree = $state(false);
	let isHoveringTree = $state(false);
	let editorWithTreeRef: HTMLElement;

	// --- Configure these ---
	const API_KEY = 'bp1_55386cf0a29212ec5deff7f14980bf648c0a22687f188a77cd71a38d4252b0c4';

	const projectSource: ProjectSource = {
		type: 'local',
		path: 'vite1',
	};

	const terminalTabs: TerminalTab[] = [
		{
			id: 'dev',
			label: 'Console',
			commands: [['npm', 'install'], ['npm', 'run', 'dev']],
			autoRun: true,
		},
		{
			id: 'shell',
			label: 'REPL',
			commands: [],
			autoRun: false,
		},
	];

	// Resizable layout state
	let sidebarFraction = $state(0.5);
	let topFraction = $state(0.5);

	let isResizingRow = $state(false);
	let isResizingCol = $state(false);
	let isHoveringRow = $state(false);
	let isHoveringCol = $state(false);
	let containerRef: HTMLElement;
	let sidebarRef: HTMLElement;

	function startRowResize() {
		isResizingRow = true;
		isHoveringRow = true;
	}

	function startColResize() {
		isResizingCol = true;
		isHoveringCol = true;
	}

	function startTreeResize() {
		isResizingTree = true;
		isHoveringTree = true;
	}

	function stopResize() {
		isResizingRow = false;
		isResizingCol = false;
		isResizingTree = false;
		isHoveringRow = false;
		isHoveringCol = false;
		isHoveringTree = false;
	}

	let rafId = 0;

	function handleMouseMove(e: MouseEvent) {
		if (!isResizingRow && !isResizingCol && !isResizingTree) return;

		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => {
			if (isResizingRow && sidebarRef) {
				const rect = sidebarRef.getBoundingClientRect();
				const fraction = (e.clientY - rect.top) / rect.height;
				topFraction = Math.max(0.1, Math.min(0.9, fraction));
			}
			if (isResizingCol && containerRef) {
				const rect = containerRef.getBoundingClientRect();
				const fraction = (e.clientX - rect.left) / rect.width;
				sidebarFraction = Math.max(0.1, Math.min(0.9, fraction));
			}
			if (isResizingTree && editorWithTreeRef) {
				const rect = editorWithTreeRef.getBoundingClientRect();
				const newWidth = e.clientX - rect.left;
				if (newWidth < 60) {
					fileTreeOpen = false;
					fileTreeWidth = 180;
				} else {
					fileTreeWidth = Math.max(100, Math.min(400, newWidth));
				}
			}
		});
	}

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('mouseup', stopResize);
		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', stopResize);
			cancelAnimationFrame(rafId);
		};
	});
</script>

{#if isResizingRow || isResizingCol || isResizingTree}
	<div
		class="resize-overlay"
		style="cursor: {isResizingRow ? 'row-resize' : 'col-resize'};"
	></div>
{/if}

<div class="layout" class:is-resizing={isResizingRow || isResizingCol || isResizingTree} bind:this={containerRef}>
	<BrowserPodEditorProvider {projectSource} apiKey={API_KEY}>
		<div class="sidebar" bind:this={sidebarRef} style="flex: {sidebarFraction} 1 0%;">
			<!-- Editor (top) -->
			<div class="editor-area" style="flex: {topFraction} 1 0%;">
				<Container title="Editor">
					{#snippet actions()}
						<button class="filetree-toggle" onclick={() => fileTreeOpen = !fileTreeOpen} title={fileTreeOpen ? 'Hide files' : 'Show files'}>
							<Icon icon={fileTreeOpen ? "tabler:layout-sidebar-filled" : "tabler:layout-sidebar-inactive"} width="16" height="16" />
						</button>
					{/snippet}
					<div class="editor-with-tree" bind:this={editorWithTreeRef}>
						{#if fileTreeOpen}
							<div class="filetree-panel" style="width: {fileTreeWidth}px;">
								<FileTree expanded />
							</div>
							<Separator direction="vertical" bind:isHovering={isHoveringTree} isResizing={isResizingTree} onMouseDown={startTreeResize} />
						{/if}
						<div class="editor-content">
							<EditorPanel />
						</div>
					</div>
				</Container>
			</div>

			<Separator direction="horizontal" bind:isHovering={isHoveringRow} isResizing={isResizingRow} onMouseDown={startRowResize} />

			<!-- Terminal (bottom) -->
			<div class="terminal-area" style="flex: {1 - topFraction} 1 0%;">
				<TerminalPanel tabs={terminalTabs} />
			</div>
		</div>

		<Separator direction="vertical" bind:isHovering={isHoveringCol} isResizing={isResizingCol} onMouseDown={startColResize} />

		<!-- Preview (right) -->
		<div class="preview-area" style="flex: {1 - sidebarFraction} 1 0%;">
			<PreviewPanel />
		</div>
	</BrowserPodEditorProvider>
</div>

<style>
	.resize-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.layout {
		display: flex;
		height: 100%;
		width: 100%;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.editor-area {
		display: flex;
		flex-direction: column;
		min-height: 50px;
		overflow: hidden;
	}

	.terminal-area {
		display: flex;
		flex-direction: column;
		min-height: 50px;
		overflow: hidden;
	}

	.preview-area {
		overflow: auto;
		min-width: 50px;
		display: flex;
	}

	/* Editor + FileTree side-by-side */
	.editor-with-tree {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.filetree-panel {
		flex-shrink: 0;
		overflow-y: auto;
		background: #101012;
	}

	.filetree-panel::-webkit-scrollbar {
		width: 4px;
	}

	.filetree-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.filetree-panel::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.editor-content {
		flex: 1;
		min-width: 0;
		display: flex;
	}

	.filetree-toggle {
		display: flex;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.3);
		transition: color 0.15s;
	}

	.filetree-toggle:hover {
		color: rgba(255, 255, 255, 0.6);
	}

	/* Prevent iframe stealing mouse events and text selection during resize */
	.layout.is-resizing {
		user-select: none;
		-webkit-user-select: none;
	}

	.layout.is-resizing :global(iframe) {
		pointer-events: none;
	}

	.layout.is-resizing :global(.cm-editor) {
		pointer-events: none;
	}
</style>
