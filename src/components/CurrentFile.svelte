<script lang="ts">
	import { getBrowserPodEditorContext } from '../context';

	const { editors, activeEditorId } = getBrowserPodEditorContext();

	/** Transform the file path for display (default: uppercase) */
	export let transform: (path: string) => string = (p) => p.toUpperCase();

	/** Optional class for styling */
	let className = '';
	export { className as class };

	// Get file path from active editor
	$: filePath = $activeEditorId !== null ? $editors.get($activeEditorId)?.filePath ?? '' : '';
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
