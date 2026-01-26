<script lang="ts">
	import { getBrowserPodEditorContext } from '../context';

	const { selectedFile } = getBrowserPodEditorContext();

	/** Transform the file path for display (default: uppercase) */
	export let transform: (path: string) => string = (p) => p.toUpperCase();

	/** Optional class for styling */
	let className = '';
	export { className as class };
</script>

<span class="current-file {className}">
	{transform($selectedFile || '')}
</span>

<style>
	.current-file {
		color: var(--color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 600;
		font-size: 0.75rem;
	}
</style>
