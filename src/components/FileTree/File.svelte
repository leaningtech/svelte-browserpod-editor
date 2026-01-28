<script lang="ts">
	import Icon from "@iconify/svelte";
	import { getBrowserPodEditorContext } from '../../context';

	const { fileSysReady, editors, openFileInActiveEditor } = getBrowserPodEditorContext();

	interface Props {
		name: string;
		parent: string;
	}

	let { name, parent }: Props = $props();
	let extension = name.slice(name.lastIndexOf(".") + 1);

	const fileExt: Record<string, string> = {
		svelte: 'devicon:svelte',
		ts: 'devicon:typescript',
		js: 'devicon:javascript',
		md: 'material-symbols:markdown',
		json: 'vscode-icons:file-type-json',
		html: 'devicon:html5',
		css: 'devicon:css3',
		svg: 'vscode-icons:file-type-svg'
	};

	// Check if any editor has this file open
	let filePath = $derived(`${parent}/${name}`);
	let isSelected = $derived([...$editors.values()].some(e => e.filePath === filePath));
</script>

<button
	class="file-btn"
	class:selected={isSelected}
	onclick={() => openFileInActiveEditor(filePath)}
	disabled={!$fileSysReady}
>
	<div class="file-icon">
		<Icon width="16" icon={(extension in fileExt) ? fileExt[extension] : 'vscode-icons:default-file'}/>
	</div>
	<span class="file-name">{name}</span>
</button>

<style>
	.file-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		border-radius: var(--bpe-radius-button);
		transition: all 0.2s ease;
		color: var(--bpe-color-text);
		font-size: 0.875rem;
		position: relative;
	}

	.file-btn:hover {
		background: var(--bpe-color-bg-hover);
	}

	.file-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.file-btn.selected {
		background: var(--bpe-color-primary);
		color: var(--bpe-color-text-on-primary);
	}

	.file-btn.selected:hover {
		background: var(--bpe-color-primary-hover);
	}

	.file-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.file-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
