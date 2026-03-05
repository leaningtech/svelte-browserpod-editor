<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { json } from '@codemirror/lang-json';
	import { EditorView } from '@codemirror/view';
	import { browserpodTheme, browserpodHighlight } from '../constants/theme.ts';
	import Container from './Container.svelte';
	import Spinner from './Spinner.svelte';
	import { resolveContext } from '../context.ts';
	import { debounce } from '../utils.ts';

	interface Props {
		onDocChanged?: (() => void) | undefined;
		ctxId?: string;
		class?: string;
	}

	let { onDocChanged = undefined, ctxId = undefined, class: className = '' }: Props = $props();

	const { fileSysReady, browserPodRunning, saveFile, loadFile, editors, activeEditorId, registerEditor, unregisterEditor, setActiveEditor } = (() => resolveContext(ctxId))();

	let editorId: number | undefined = $state();
	let content = $state('');
	let loadedFilePath = '';

	onMount(() => {
		editorId = registerEditor();
	});

	onDestroy(() => {
		if (editorId !== undefined) {
			unregisterEditor(editorId);
		}
	});

	let editorConfig = $derived(editorId !== undefined ? $editors.get(editorId) : undefined);
	let filePath = $derived(editorConfig?.filePath ?? '');

	$effect(() => {
		if (filePath && $fileSysReady && filePath !== loadedFilePath) {
			loadedFilePath = filePath;
			loadFile(filePath).then(fileContent => {
				content = fileContent;
			}).catch(e => {
				console.error('Failed to load file:', e);
			});
		}
	});

	let isActive = $derived($editors.size > 1 && $activeEditorId === editorId);

	function getLanguageExtension(filename: string) {
		const ext = filename.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'js': case 'mjs': return [javascript()];
			case 'ts': case 'tsx': return [javascript({ typescript: true })];
			case 'jsx': return [javascript({ jsx: true })];
			case 'html': case 'svelte': return [html()];
			case 'css': return [css()];
			case 'json': return [json()];
			default: return [];
		}
	}

	const debounceSaveFile = debounce(() => {
		if (loadedFilePath) {
			saveFile(loadedFilePath, content);
		}
	}, 1000);

	let editorExtensions = $derived([
		...getLanguageExtension(filePath),
		browserpodTheme,
		browserpodHighlight,
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onDocChanged?.();
				if ($browserPodRunning) debounceSaveFile();
			}
		})
	]);

	function handleFocus() {
		if (editorId !== undefined) {
			setActiveEditor(editorId);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="editor-wrapper"
	class:editor-active={isActive}
	onclick={handleFocus}
	onfocusin={handleFocus}
>
	<Container
		class={className}
	>
		{#snippet headerInline()}
			{#if filePath}
				<span class="file-path">{filePath}</span>
			{/if}
		{/snippet}
		{#if !$fileSysReady}
			<Spinner />
		{:else}
			<div class="editor-content">
				<CodeMirror
					class="cm-editor"
					bind:value={content}
					extensions={editorExtensions}
				/>
			</div>
		{/if}
	</Container>
</div>

<style>
	.editor-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		min-width: 0;
	}

	.editor-wrapper.editor-active {
		outline: var(--bpe-editor-active-border, 2px solid var(--bpe-color-primary));
		outline-offset: -2px;
	}

	.file-path {
		color: var(--bpe-color-text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 250px;
		font-size: 0.75rem;
	}

	.editor-content {
		height: 100%;
		overflow: auto;
	}

	.editor-content :global(.cm-editor) {
		height: 100%;
	}

	.editor-content :global(.cm-scroller) {
		overflow: auto;
		align-items: stretch;
	}
</style>
