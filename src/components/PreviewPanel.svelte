<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import Container from './Container.svelte';
	import DropdownMenu from './DropdownMenu.svelte';
	import DropdownItem from './DropdownItem.svelte';
	import Spinner from './Spinner.svelte';
	import QRCode from 'qrcode';
	import { resolveContext } from '../context.ts';
	import { trackEvent } from '../utils.ts';

	interface Props {
		class?: string;
		port?: number;
		ctxId?: string;
	}

	let { class: className = '', port = $bindable(), ctxId = undefined }: Props = $props();

	const { browserPodRunning, portalUrls } = (() => resolveContext(ctxId))();

	let portalUrl = $derived(port ? portalUrls.get(port) : undefined);
	$effect(() => {
		if (port === undefined && portalUrls.size > 0) {
			port = portalUrls.keys().next()?.value;
		}
	});

	let portalElement: HTMLIFrameElement | undefined = $state();
	let showQr = $state(false);
	let qrCodeCanvas: HTMLCanvasElement | undefined = $state();
	let copied = $state(false);
	let copiedTimeout: ReturnType<typeof setTimeout>;

	let isPortalAvailable = $derived($browserPodRunning && portalUrl);

	onMount(() => {
		return () => {
			clearTimeout(copiedTimeout);
		};
	});

	function copyPortalUrl() {
		if (portalUrl) {
			navigator.clipboard.writeText(portalUrl);
			copied = true;
			clearTimeout(copiedTimeout);
			copiedTimeout = setTimeout(() => (copied = false), 1200);
		}
	}

	function openInNewTab() {
		if (portalUrl) {
			trackEvent('OpenPortal');
			window.open(portalUrl, '_blank');
		}
	}

	function refreshPreview() {
		if (portalElement && portalUrl) {
			portalElement.src = portalUrl;
		}
	}

	function toggleQr() {
		showQr = !showQr;
		if (showQr && portalUrl) {
			setTimeout(() => generateQRCode(), 0);
		}
	}

	function generateQRCode() {
		if (portalUrl && qrCodeCanvas) {
			QRCode.toCanvas(qrCodeCanvas, portalUrl, {
				width: 150,
				margin: 0,
				color: { dark: '#000000', light: '#ffffff' },
				errorCorrectionLevel: 'H'
			}, (error: any) => {
				if (error) console.error('Error generating QR code:', error);
			});
		}
	}

	$effect(() => {
		if (portalUrl && portalElement) {
			portalElement.src = portalUrl;
		}
	});

	export function hideOverlay() {
		showQr = false;
	}
</script>

<Container
	title="Preview"
	class={className}
>
	{#snippet actions()}
		{#if isPortalAvailable}
			<DropdownMenu align="right">
				{#snippet trigger()}
					<button class="icon-trigger">
						<Icon icon="tabler:adjustments-horizontal" width="20" height="20" />
					</button>
				{/snippet}
				<DropdownItem onclick={refreshPreview}>
					{#snippet icon()}
						<Icon icon="tabler:refresh" width="16" height="16" />
					{/snippet}
					Refresh
				</DropdownItem>
				<DropdownItem onclick={copyPortalUrl}>
					{#snippet icon()}
						<Icon icon="tabler:copy" width="16" height="16" />
					{/snippet}
					{copied ? 'Copied!' : 'Copy URL'}
				</DropdownItem>
				<DropdownItem onclick={openInNewTab}>
					{#snippet icon()}
						<Icon icon="tabler:external-link" width="16" height="16" />
					{/snippet}
					Open in New Tab
				</DropdownItem>
				<DropdownItem onclick={toggleQr}>
					{#snippet icon()}
						<Icon icon="tabler:qrcode" width="16" height="16" />
					{/snippet}
					{showQr ? 'Hide QR Code' : 'QR Code'}
				</DropdownItem>
			</DropdownMenu>
		{/if}
	{/snippet}

	<div class="portal-content">
		{#if !isPortalAvailable}
			<Spinner />
		{:else}
			<div class="portal-wrapper">
				<iframe bind:this={portalElement} class="portal" title="Preview"></iframe>

				{#if showQr && portalUrl}
					<div class="portal-overlay">
						<div class="qr-card">
							<p class="qr-label">Scan to open on device</p>
							<div class="qr-code">
								<canvas bind:this={qrCodeCanvas} width="150" height="150"></canvas>
							</div>
							<div class="qr-url-row">
								<p class="qr-url">{portalUrl}</p>
							</div>
							<div class="qr-actions">
								<button class="qr-btn qr-btn-primary" onclick={copyPortalUrl}>
									{copied ? 'Copied!' : 'Copy URL'}
								</button>
								<button class="qr-btn qr-btn-secondary" onclick={toggleQr}>
									Close
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Container>


<style>
	.icon-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: rgba(255, 255, 255, 0.5);
		transition: color 0.2s;
	}

	.icon-trigger:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.portal-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		overflow: auto;
		position: relative;
	}

	.portal-wrapper {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.portal {
		flex: 1 1 auto;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		display: block;
		border: none;
		background: white;
	}

	.portal-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(16, 16, 18, 0.85);
		backdrop-filter: blur(8px);
		z-index: 10;
		animation: fadeIn 0.2s ease-out;
	}

	.qr-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		background: #1e2025;
		border: 1px solid #23252a;
		border-radius: 0.5rem;
		max-width: 16rem;
		width: 100%;
	}

	.qr-label {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
	}

	.qr-code {
		background: white;
		padding: 0.5rem;
		border-radius: 0.375rem;
	}

	.qr-url-row {
		width: 100%;
		padding: 0.375rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.25rem;
	}

	.qr-url {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.6875rem;
		word-break: break-all;
		text-align: center;
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
	}

	.qr-actions {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	.qr-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.25rem;
		cursor: pointer;
		border: none;
		transition: background 0.15s;
	}

	.qr-btn-primary {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.qr-btn-primary:hover {
		background: rgba(255, 255, 255, 0.15);
		color: white;
	}

	.qr-btn-secondary {
		background: none;
		color: rgba(255, 255, 255, 0.3);
	}

	.qr-btn-secondary:hover {
		color: rgba(255, 255, 255, 0.6);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
