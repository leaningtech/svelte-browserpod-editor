<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		trigger: Snippet;
		children: Snippet;
		align?: 'left' | 'right';
	};

	let { trigger, children, align = 'right' }: Props = $props();
	let open = $state(false);
	let menuRef: HTMLElement;

	function toggle() {
		open = !open;
	}

	function handleClickOutside(e: MouseEvent) {
		if (open && menuRef && !menuRef.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="dropdown-menu" bind:this={menuRef}>
	<button class="dropdown-trigger" onclick={toggle}>
		{@render trigger()}
	</button>

	{#if open}
		<div
			class="dropdown-panel"
			class:dropdown-align-right={align === 'right'}
			class:dropdown-align-left={align === 'left'}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.dropdown-menu {
		position: relative;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.dropdown-panel {
		position: absolute;
		top: 100%;
		margin-top: 0.25rem;
		z-index: 50;
		min-width: 9rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: var(--bpe-color-dropdown-bg, #1e2025);
		padding: 0.25rem 0;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
		animation: menuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
		transform-origin: top;
	}

	.dropdown-align-right {
		right: 0;
	}

	.dropdown-align-left {
		left: 0;
	}

	@keyframes menuIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
