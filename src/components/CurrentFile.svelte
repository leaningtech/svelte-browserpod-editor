<script lang="ts">
	import { getBrowserPodEditorContext } from '../context';

	const { editors, activeEditorId } = getBrowserPodEditorContext();

	

	/** Optional class for styling */
	interface Props {
		/** Transform the file path for display (default: uppercase) */
		transform?: (path: string) => string;
		class?: string;
	}

	let { transform = (p) => p.toUpperCase(), class: className = '' }: Props = $props();
	

	// Get file path from active editor
	let filePath = $derived($activeEditorId !== null ? $editors.get($activeEditorId)?.filePath ?? '' : '');
</script>

<span class="current-file {className}">
	{transform(filePath)}
</span>

<style>
	.current-file {
		color: var(--bpe-color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
		font-size: 0.75rem;
	}
</style>
