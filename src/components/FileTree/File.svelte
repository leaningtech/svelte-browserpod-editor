<script lang="ts">
	import { resolveContext } from '../../context.ts';

	interface Props {
		name: string;
		parent: string;
		ctxId?: string;
	}

	let { name, parent, ctxId = undefined }: Props = $props();

	const { fileSysReady, editors, openFileInActiveEditor } = (() => resolveContext(ctxId))();

	let filePath = $derived(parent ? `${parent}/${name}` : name);
	let isSelected = $derived([...$editors.values()].some(e => e.filePath === filePath));
</script>

<button
	class="file-btn"
	class:selected={isSelected}
	onclick={() => openFileInActiveEditor(filePath)}
	disabled={!$fileSysReady}
>
	<span class="file-name">{name}</span>
</button>

<style>
	.file-btn {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0.2rem 0.5rem 0.2rem 1.25rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s, color 0.15s;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8125rem;
	}

	.file-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.8);
	}

	.file-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.file-btn.selected {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.08);
	}

	.file-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
