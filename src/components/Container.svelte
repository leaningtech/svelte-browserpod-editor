<script lang="ts">
	import Icon from "@iconify/svelte";
	export let title = "Editor";
	export let icon = "mdi:code-braces";
	export let actionsFullWidth = false;

	let className = '';
	export { className as class };
</script>

<div class="panel {className}" {...$$restProps}>
	<header class="panel-header">
		<span class="panel-title-container">
			<Icon icon={icon} width='14' color='var(--color-text)'/>
			<span class="panel-title">{title}</span>
			<!-- Inline header slot for arbitrary content -->
			<slot name="headerInline"></slot>
		</span>
		<div
			class="panel-actions"
			class:full-width={actionsFullWidth}
		>
			<slot name="actions"></slot>
		</div>
	</header>
	<div class="panel-content">
		<slot/>
	</div>
</div>

<style>
	.panel {
		border-radius: var(--radius-panel);
		box-shadow: var(--shadow-panel);
		overflow: hidden;
		border: 1px solid var(--color-border);
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
		border-bottom: 1px solid var(--color-border);
		padding: 0.375rem 0.75rem;
		background: linear-gradient(
			to bottom,
			var(--color-panel-header-start),
			var(--color-panel-header-end)
		);
		border-top-left-radius: var(--radius-panel);
		border-top-right-radius: var(--radius-panel);
		box-shadow: var(--shadow-header);
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
		color: var(--color-text);
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
		flex: var(--panel-content-flex, 1 1 auto);
		min-height: var(--panel-content-min-height, 0);
		height: 0; /* Explicit height allows children to use height: 100% */
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
