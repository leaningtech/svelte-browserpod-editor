<script lang="ts">
	import Icon from "@iconify/svelte";
	import { getBrowserPodEditorContext } from '../../context';

	const { fileSysReady, selectedFile } = getBrowserPodEditorContext();

	export let name: string;
	export let parent: string;
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

	$: isSelected = $selectedFile === `${parent}/${name}`;
</script>

<button
	class="file-btn"
	class:selected={isSelected}
	on:click={() => selectedFile.set(`${parent}/${name}`)}
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
		border-radius: var(--radius-button);
		transition: all 0.2s ease;
		color: var(--color-text);
		font-size: 0.875rem;
		position: relative;
	}

	.file-btn:hover {
		background: var(--color-bg-hover);
	}

	.file-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.file-btn.selected {
		background: var(--color-primary);
		color: var(--color-text-on-primary);
	}

	.file-btn.selected:hover {
		background: var(--color-primary-hover);
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
