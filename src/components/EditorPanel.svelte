<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { json } from '@codemirror/lang-json';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { EditorView } from '@codemirror/view';
	import Container from './Container.svelte';
	import Spinner from './Spinner.svelte';
	import { getBrowserPodEditorContext } from '../context';
	import { debounce } from '../utils';

	const { fileSysReady, selectedFile, fileContent, browserPodRunning, saveFile } = getBrowserPodEditorContext();

	export let onDocChanged: (() => void) | undefined = undefined;

	function getLanguageExtension(filename: string) {
		const ext = filename.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'js': case 'mjs': return [javascript()];
			case 'html': case 'svelte': return [html()];
			case 'css': return [css()];
			case 'json': return [json()];
			default: return [];
		}
	}

	const debounceSaveFile = debounce(() => saveFile($selectedFile, $fileContent), 1000);

	$: editorExtensions = [
		...getLanguageExtension($selectedFile),
		oneDark,
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onDocChanged?.();
				if ($browserPodRunning) debounceSaveFile();
			}
		})
	];
</script>

<Container
	title="Editor"
	class="editor-panel"
>
	<span slot="headerInline" class="file-path">
		{($selectedFile || '').toUpperCase()}
	</span>
	{#if !$fileSysReady}
		<Spinner />
	{:else}
		<CodeMirror
			class="cm-editor"
			bind:value={$fileContent}
			extensions={editorExtensions}
		/>
	{/if}
</Container>

<style>
	.file-path {
		color: var(--color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 250px;
		font-weight: 600;
		font-size: 0.75rem;
	}
</style>
