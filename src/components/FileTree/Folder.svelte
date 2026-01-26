<script lang="ts">
	import Icon from "@iconify/svelte";
	import File from "./File.svelte";
	import { slide } from "svelte/transition";
	import type { TreeNode } from '../../types';

	export let expanded = false;
	export let parent = '';
	export let name = '';
	export let files: TreeNode[];

	const fullPath = `${(parent) ? `${parent}/` : ''}${(name) ? name : ''}`;

	if (!name) name = 'project';

	function toggle() {
		expanded = !expanded;
	}
</script>

<button class="folder-btn" on:click={toggle}>
	<div class="folder-icon">
		{#if expanded}
			<Icon width="16" icon="mdi:folder-open" color="var(--bpe-color-primary)"/>
		{:else}
			<Icon width="16" icon="mdi:folder" color="var(--bpe-color-primary)"/>
		{/if}
	</div>
	<span class="folder-name">{name}</span>
	<div class="expand-icon">
		{#if expanded}
			<Icon width="14" icon="mdi:chevron-down" />
		{:else}
			<Icon width="14" icon="mdi:chevron-right" />
		{/if}
	</div>
</button>

{#if expanded}
	<ul class="tree-items-list" transition:slide={{ duration: 300 }}>
		{#each files as file}
			<li class="tree-item">
				{#if file.type === "folder"}
					<svelte:self {...file} parent={fullPath} />
				{:else}
					<File {...file} parent={fullPath} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.folder-btn {
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
	}

	.folder-btn:hover {
		background: var(--bpe-color-bg-hover);
		color: var(--bpe-color-primary);
	}

	.folder-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.folder-name {
		flex: 1;
		font-weight: 500;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.expand-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.folder-btn:hover .expand-icon {
		opacity: 1;
	}

	.tree-items-list {
		list-style: none;
		margin: 0;
		padding: 0 0 0 1rem;
		border-left: 1px solid var(--bpe-color-border);
		margin-left: 0.5rem;
	}

	.tree-item {
		position: relative;
		margin: 0;
		padding: 0;
	}

	.tree-item::before {
		content: '';
		position: absolute;
		left: -1px;
		top: 1rem;
		width: 0.75rem;
		height: 1px;
		background: var(--bpe-color-border);
	}
</style>
