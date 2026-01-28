<script lang="ts">
	import Icon from "@iconify/svelte";

	interface Props {
		title?: string;
		icon?: string;
		actionsFullWidth?: boolean;
		class?: string;
		headerInline?: import('svelte').Snippet;
		actions?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		[key: string]: any
	}

	let {
		title = "Editor",
		icon = "mdi:code-braces",
		actionsFullWidth = false,
		class: className = '',
		headerInline,
		actions,
		children,
		...rest
	}: Props = $props();
	
</script>

<div class="panel {className}" {...rest}>
	<header class="panel-header">
		<span class="panel-title-container">
			<Icon icon={icon} width='14' color='var(--bpe-color-text)'/>
			<span class="panel-title">{title}</span>
			<!-- Inline header slot for arbitrary content -->
			{@render headerInline?.()}
		</span>
		<div
			class="panel-actions"
			class:full-width={actionsFullWidth}
		>
			{@render actions?.()}
		</div>
	</header>
	<div class="panel-content">
		{@render children?.()}
	</div>
</div>

<style>
	.panel {
		border-radius: var(--bpe-radius-panel);
		box-shadow: var(--bpe-shadow-panel);
		overflow: hidden;
		border: 1px solid var(--bpe-color-border);
		display: flex;
		flex-direction: column;
		min-height: 0;
		/* Fill parent container in any layout context */
		flex: 1;
		width: 100%;
		height: 100%;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--bpe-color-border);
		padding: 0.375rem 0.75rem;
		background: linear-gradient(
			to bottom,
			var(--bpe-color-panel-header-start),
			var(--bpe-color-panel-header-end)
		);
		border-top-left-radius: var(--bpe-radius-panel);
		border-top-right-radius: var(--bpe-radius-panel);
		box-shadow: var(--bpe-shadow-header);
	}

	.panel-title-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.panel-title {
		margin: 0;
		font-size: 0.75rem;
		color: var(--bpe-color-text);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.panel-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.panel-actions.full-width {
		margin-left: 12px;
		flex: 1 1 auto;
		min-width: 0;
	}

	.panel-content {
		flex: var(--bpe-panel-content-flex, 1 1 auto);
		min-height: var(--bpe-panel-content-min-height, 0);
		height: 0; /* Explicit height allows children to use height: 100% */
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
