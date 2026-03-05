<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick?: () => void;
		icon?: Snippet;
		children: Snippet;
	}

	let { onclick, icon, children }: Props = $props();
</script>

<button class="dropdown-item" onclick={onclick}>
	{#if icon}
		<span class="dropdown-item-icon">
			{@render icon()}
		</span>
	{/if}
	<span class="dropdown-item-label">
		{@render children()}
	</span>
</button>

<style>
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.4rem 0.75rem;
		text-align: left;
		font-size: 0.8125rem;
		color: var(--bpe-color-dropdown-item, rgba(255, 255, 255, 0.7));
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
		white-space: nowrap;
	}

	.dropdown-item:hover {
		background: var(--bpe-color-dropdown-item-hover-bg, rgba(255, 255, 255, 0.08));
		color: var(--bpe-color-dropdown-item-hover, white);
	}

	.dropdown-item-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.dropdown-item:hover .dropdown-item-icon {
		opacity: 1;
	}

	.dropdown-item-label {
		flex: 1;
		min-width: 0;
	}
</style>
