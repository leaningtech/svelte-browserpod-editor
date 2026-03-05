<script lang="ts">
	interface Props {
		title?: string;
		class?: string;
		headerInline?: import('svelte').Snippet;
		actions?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		title = '',
		class: className = '',
		headerInline,
		actions,
		children,
		...rest
	}: Props = $props();
</script>

<div class="panel {className}" {...rest}>
	{#if title || headerInline || actions}
		<header class="panel-header">
			<div class="panel-header-left">
				{#if title}
					<span class="panel-title">{title}</span>
				{/if}
				{@render headerInline?.()}
			</div>
			{#if actions}
				<div class="panel-actions">
					{@render actions?.()}
				</div>
			{/if}
		</header>
	{/if}
	<div class="panel-content">
		{@render children?.()}
	</div>
</div>

<style>
	.panel {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1;
		width: 100%;
		height: 100%;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--bpe-color-border);
		padding: var(--bpe-container-header-padding);
	}

	.panel-header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-title {
		font-size: 0.875rem;
		color: var(--bpe-color-text-header);
		font-weight: 400;
	}

	.panel-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.panel-content {
		flex: 1 1 auto;
		min-height: 0;
		height: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
