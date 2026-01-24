<script lang="ts">
	import Icon from "@iconify/svelte";
	export let title = "Editor";
	export let icon = "mdi:code-braces";
	export let actionsFullWidth = false;
</script>

<div class="panel" {...$$restProps} style="
		border-radius: 12px;
		box-shadow: 0 4px 16px rgba(0,0,0,0.10);
		overflow: hidden;
		border: 1px solid var(--color-border);">
	<header class="panel-header">
		<span class="panel-title-container">
			<Icon icon={icon} width='14' color='var(--color-text)'/>
			<span class="panel-title">{title}</span>
			<!-- Inline header slot for arbitrary content -->
			<slot name="headerInline"></slot>
		</span>
		<div
			class="panel-actions"
			style={actionsFullWidth
				? "margin-left: 12px; display: flex; align-items: center; gap: 6px; flex: 1 1 auto; min-width: 0;"
				: "margin-left: auto; display: flex; align-items: center; gap: 6px;"}
		>
			<slot name="actions"></slot>
		</div>
	</header>
	<div class="panel-content">
		<slot/>
	</div>
</div>
