<script lang="ts">
	import Icon from '@iconify/svelte';
	import Folder from './Folder.svelte';
	import File from "./File.svelte";
	import { slide } from "svelte/transition";
	import type { TreeNode } from '../../types.ts';

	interface Props {
		expanded?: boolean;
		parent?: string;
		name?: string;
		files: TreeNode[];
		ctxId?: string;
	}

	let {
		expanded = $bindable(false),
		parent = '',
		name = '',
		files,
		ctxId = undefined
	}: Props = $props();

	const fullPath = $derived(`${(parent) ? `${parent}/` : ''}${name}`);
	const displayName = $derived(name || 'project');

	function toggle() {
		expanded = !expanded;
	}
</script>

<button class="folder-btn" onclick={toggle}>
	<span class="chevron" class:expanded>
		<Icon icon="tabler:chevron-right" width="12" height="12" />
	</span>
	<span class="folder-name">{displayName}</span>
</button>

{#if expanded}
	<ul class="tree-list" transition:slide={{ duration: 150 }}>
		{#each files as file}
			<li>
				{#if file.type === "folder"}
					<Folder {...file} parent={fullPath} {ctxId} />
				{:else}
					<File {...file} parent={fullPath} {ctxId} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.folder-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: 100%;
		padding: 0.2rem 0.5rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.8125rem;
	}

	.folder-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.9);
	}

	.chevron {
		display: flex;
		flex-shrink: 0;
		color: rgba(255, 255, 255, 0.3);
		transition: transform 0.15s ease;
	}

	.chevron.expanded {
		transform: rotate(90deg);
	}

	.folder-name {
		flex: 1;
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tree-list {
		list-style: none;
		margin: 0;
		padding: 0 0 0 0.75rem;
	}

	li {
		margin: 0;
		padding: 0;
	}
</style>
