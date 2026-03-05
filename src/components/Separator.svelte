<script lang="ts">
	type Props = {
		direction: 'horizontal' | 'vertical';
		isHovering?: boolean;
		isResizing?: boolean;
		onMouseDown?: () => void;
	};

	let {
		direction,
		isHovering = $bindable(false),
		isResizing = false,
		onMouseDown
	}: Props = $props();
</script>

<div
	class="separator"
	class:separator-horizontal={direction === 'horizontal'}
	class:separator-vertical={direction === 'vertical'}
	role="separator"
	aria-orientation={direction}
>
	<!-- Large invisible hit area for mouse events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="separator-hitarea"
		class:separator-hitarea-horizontal={direction === 'horizontal'}
		class:separator-hitarea-vertical={direction === 'vertical'}
		onmousedown={onMouseDown}
		onmouseenter={() => (isHovering = true)}
		onmouseleave={() => {
			if (!isResizing) isHovering = false;
		}}
	></div>
	<!-- Thin visible line -->
	<div
		class="separator-line"
		class:separator-line-horizontal={direction === 'horizontal'}
		class:separator-line-vertical={direction === 'vertical'}
		class:separator-highlight={isHovering || isResizing}
	></div>
</div>

<style>
	.separator {
		position: relative;
		z-index: 10;
		flex-shrink: 0;
	}

	.separator-horizontal {
		height: 1px;
	}

	.separator-vertical {
		width: 1px;
	}

	.separator-hitarea {
		position: absolute;
		inset: 0;
	}

	.separator-hitarea-horizontal {
		height: 25px;
		top: -12px;
		left: 0;
		right: 0;
		cursor: row-resize;
	}

	.separator-hitarea-vertical {
		width: 25px;
		left: -12px;
		top: 0;
		bottom: 0;
		cursor: col-resize;
	}

	.separator-line {
		background-color: var(--bpe-color-separator, #23252a);
		transition: all 0.3s;
	}

	.separator-line-horizontal {
		height: 1px;
		width: 100%;
	}

	.separator-line-vertical {
		height: 100%;
		width: 1px;
	}

	.separator-highlight {
		animation: dragHighlight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		animation-delay: var(--bpe-separator-hover-delay, 200ms);
	}

	@keyframes dragHighlight {
		from {
			background-color: var(--bpe-color-separator, #23252a);
			box-shadow: none;
		}
		to {
			background-color: rgba(255, 255, 255, 0.436);
			box-shadow: 0 0 12px rgba(255, 255, 255, 0.436);
		}
	}
</style>
