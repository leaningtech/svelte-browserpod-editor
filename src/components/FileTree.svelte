<script lang="ts">
	import Folder from './FileTree/Folder.svelte';
	import Spinner from './Spinner.svelte';
	import { resolveContext } from '../context.ts';


	/** Optional class for styling */
	interface Props {
		/** Whether to expand folders by default */
		expanded?: boolean;
		ctxId?: string;
		class?: string;
	}

	let { expanded = true, ctxId = undefined, class: className = '' }: Props = $props();

	const resolvedCtx = (() => resolveContext(ctxId))();
	const { fileSysReady, fileTree } = resolvedCtx;
	
</script>

{#if !$fileSysReady}
	<div class="loading-container">
		<Spinner />
		<p class="loading-text">Loading files...</p>
	</div>
{:else}
	<div class="file-tree {className}">
		<Folder files={$fileTree} {expanded} {ctxId} />
	</div>
{/if}

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		gap: 0.5rem;
	}

	.loading-text {
		font-size: 0.875rem;
		color: var(--bpe-color-text-secondary);
		margin: 0;
	}

	.file-tree {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.file-tree::-webkit-scrollbar {
		width: 6px;
	}

	.file-tree::-webkit-scrollbar-track {
		background: transparent;
	}
</style>
