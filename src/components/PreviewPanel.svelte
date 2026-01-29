<script lang="ts">
	import { onMount } from 'svelte';
	import Container from './Container.svelte';
	import Spinner from './Spinner.svelte';
	import Icon from '@iconify/svelte';
	import QRCode from 'qrcode';
	import { getBrowserPodEditorContext } from '../context';
	import { trackEvent } from '../utils';

	interface Props {
		class?: string;
		port?: number;
	}

	let { class: className = '', port = $bindable() }: Props = $props();
	

	const { browserPodRunning, portalUrls } = getBrowserPodEditorContext();

	let portalUrl = $derived(port? portalUrls.get(port) : undefined);
	$effect(() => {
		if (port === undefined && portalUrls.size > 0) {
			port = portalUrls.keys().next()?.value;
		}
	});
	let portalElement: HTMLIFrameElement|undefined = $state();
	let showPortalInfo = $state(false);
	let portalInfoTimeout: ReturnType<typeof setTimeout>;
	let portalInfoAutoShown = $state(false);
	let isMobile = $state(false);
	let qrCodeCanvas: HTMLCanvasElement|undefined = $state();
	let qrCodeGenerated = false;
	let copied = $state(false);
	let copiedTimeout: ReturnType<typeof setTimeout>;
	let showMobilePortal = $state(false);

	onMount(() => {
		checkMobileView();
		window.addEventListener('resize', checkMobileView);
		return () => {
			window.removeEventListener('resize', checkMobileView);
			clearTimeout(portalInfoTimeout);
			clearTimeout(copiedTimeout);
		};
	});

	let isPortalAvailable = $derived($browserPodRunning && portalUrl);

	function copyPortalUrl() {
		if (portalUrl) {
			navigator.clipboard.writeText(portalUrl);
			copied = true;
			clearTimeout(copiedTimeout);
			copiedTimeout = setTimeout(() => copied = false, 1200);
		}
	}

	function viewPortalUrl() {
		if (portalUrl) {
			trackEvent('OpenPortal');
			window.open(portalUrl, '_blank');
		}
	}

	function togglePortalInfo() {
		showPortalInfo = !showPortalInfo;
		clearTimeout(portalInfoTimeout);
		portalInfoAutoShown = true;
		qrCodeGenerated = false;

		if (showPortalInfo && portalUrl) {
			setTimeout(() => generateQRCode(), 0);
		}
	}

	function toggleMobilePortal() {
		showMobilePortal = !showMobilePortal;
		qrCodeGenerated = false;
		if (showMobilePortal && portalUrl) {
			setTimeout(() => generateQRCode(), 0);
		}
	}

	function generateQRCode() {
		if (portalUrl && qrCodeCanvas) {
			QRCode.toCanvas(qrCodeCanvas, portalUrl, {
				width: 150,
				margin: 0,
				color: {
					dark: "#000000",
					light: "#ffffff"
				},
				errorCorrectionLevel: 'H'
			}, function(error: any) {
				if (error) {
					console.error('Error generating QR code:', error);
				} else {
					qrCodeGenerated = true;
				}
			});
		}
	}

	function checkMobileView() {
		isMobile = window.innerWidth < 768;

		if (isMobile) {
			clearTimeout(portalInfoTimeout);
			portalInfoAutoShown = true;
			showPortalInfo = false;
		}
	}

	$effect(() => {
		if (portalUrl && !showPortalInfo && !portalInfoAutoShown && !isMobile) {
			clearTimeout(portalInfoTimeout);
			portalInfoTimeout = setTimeout(() => {
				showPortalInfo = true;
				portalInfoAutoShown = true;
				setTimeout(() => generateQRCode(), 0);
			}, 3000);
		}
	});

	$effect(() => {
		if (portalUrl && portalElement) {
			portalElement.src = portalUrl;
		}
	});

	export function hideOverlay() {
		showPortalInfo = false;
		showMobilePortal = false;
	}

	export function resetAutoShow() {
		clearTimeout(portalInfoTimeout);
		portalInfoAutoShown = true;
	}
</script>

<Container
	title="Preview"
	icon="mdi:link"
	class={className}
	actionsFullWidth={true}
>
	{#snippet actions()}
		<div  class="portal-controls preview-actions">
			{#if isPortalAvailable}
				{#if isMobile}
					<button
						class="view-btn"
						onclick={copyPortalUrl}
						aria-label="Copy portal URL"
						title="Copy portal URL"
					>
						<Icon icon="mdi:clipboard-outline" width="12" height="12" />
						<span>{copied ? "Copied!" : "Copy Portal"}</span>
					</button>
				{:else}
					<button
						class="view-btn"
						onclick={togglePortalInfo}
						aria-label={showPortalInfo ? "Hide portal info" : "Show portal info"}
						title={showPortalInfo ? "Hide portal info" : "Show portal info"}
					>
						<Icon icon={showPortalInfo ? "mdi:eye-off" : "mdi:qrcode"} width="12" height="12" />
						<span>{showPortalInfo ? "Hide" : "Portal"}</span>
					</button>
				{/if}
			{:else}
				<button
					class="view-btn"
					disabled
					aria-label="Portal unavailable"
				>
					<Icon icon="mdi:link-off" width="12" height="12" />
					<span>Portal Unavailable</span>
				</button>
			{/if}
		</div>
	{/snippet}

	<div class="portal-content">
		{#if !$browserPodRunning}
			<Spinner />
		{:else}
			<div class="portal-wrapper">
			<iframe bind:this={portalElement} class="portal" id="portal" title="Portal"></iframe>

			{#if showPortalInfo && !isMobile && portalUrl}
				<div class="portal-overlay">
					<h2 class="portal-overlay-title">
						Scan this Portal
					</h2>
					<div class="qr-code">
						<canvas bind:this={qrCodeCanvas} width="150" height="150"></canvas>
					</div>
					<div class="portal-url-container">
						<p class="portal-url-text">
							{portalUrl}
						</p>
						<div class="portal-actions">
							<button
								class="portal-action-btn copy-action"
								onclick={copyPortalUrl}
							>
								<Icon icon="mdi:clipboard-outline" class="mr-1" width="14" height="14" />
								{copied ? "Copied!" : "Copy URL"}
							</button>
							<button
								class="portal-action-btn close-action"
								onclick={togglePortalInfo}
							>
								<Icon icon="mdi:close" class="mr-1" width="14" height="14" />
								Hide
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if showMobilePortal && isMobile && portalUrl}
				<div class="portal-overlay mobile-portal-overlay">
					<h2 class="portal-overlay-title" style="font-size: 1.25rem; margin-bottom: 1rem;">
						Scan this Portal
					</h2>
					<div class="qr-code" style="margin-bottom: 0.75rem;">
						<canvas bind:this={qrCodeCanvas} width="150" height="150"></canvas>
					</div>
					<div class="portal-url-container" style="max-width: 18rem; padding: 0.5rem;">
						<p class="portal-url-text">
							{portalUrl}
						</p>
						<div class="portal-actions">
							<button
								class="portal-action-btn copy-action"
								onclick={copyPortalUrl}
							>
								<Icon icon="mdi:clipboard-outline" class="mr-1" width="14" height="14" />
								{copied ? "Copied!" : "Copy URL"}
							</button>
							<button
								class="portal-action-btn close-action"
								onclick={toggleMobilePortal}
							>
								<Icon icon="mdi:close" class="mr-1" width="14" height="14" />
								Close
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
		{/if}
	</div>
	{#if isMobile && portalUrl}
		<div class="mobile-portal-btn-container">
			<button
				class="view-btn mobile-portal-btn"
				onclick={toggleMobilePortal}
			>
				<Icon icon={showMobilePortal ? "mdi:eye-off" : "mdi:qrcode"} class="mr-2" width="16" height="16" />
				{showMobilePortal ? "Hide QR Code" : "Show Portal QR Code"}
			</button>
		</div>
	{/if}
</Container>

<style>
	.portal-content {
		width: 100%;
		height: 100%;
		max-height: 100%;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		overflow: auto;
		position: relative;
	}

	.portal-wrapper {
		width: 100%;
		height: 100%;
		max-width: 100%;
		max-height: 100%;
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
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
		transition: transform 0.2s;
		overflow: hidden;
		pointer-events: auto;
	}

	.portal-overlay,
	.mobile-portal-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(2px);
		z-index: 10;
		animation: fadeIn 0.3s ease-in;
		overflow: hidden;
		pointer-events: auto;
	}

	.portal-overlay-title {
		text-align: center;
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
		margin-bottom: 1.5rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.qr-code {
		background: white;
		padding: 0.5rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}

	.portal-url-container {
		background: rgba(0, 0, 0, 0.6);
		padding: 0.75rem;
		border-radius: 0.5rem;
		width: 100%;
		max-width: 20rem;
	}

	.portal-url-text {
		color: white;
		font-size: 0.75rem;
		word-break: break-all;
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.portal-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.portal-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
		cursor: pointer;
		border: none;
	}

	.copy-action {
		background: var(--bpe-color-primary);
		color: var(--bpe-color-text-on-primary);
	}

	.close-action {
		background: var(--bpe-color-button-secondary);
		color: var(--bpe-color-text-on-primary);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.mobile-portal-btn-container {
		margin-top: 0.5rem;
		display: flex;
		justify-content: center;
	}

	.mobile-portal-btn {
		background: var(--bpe-color-primary);
		color: white;
		padding: 0.5rem 1.25rem;
		border-radius: 0.75rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.view-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--bpe-color-text-muted);
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		transition: background 0.2s;
	}

	.view-btn:hover:not(:disabled) {
		color: var(--bpe-color-text);
	}

	.view-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.portal-overlay-title {
			font-size: 1.25rem;
			margin-bottom: 1rem;
		}

		.portal-url-container {
			max-width: 18rem;
			padding: 0.5rem;
		}
	}

	.mobile-portal-overlay .portal-overlay-title {
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}
	.mobile-portal-overlay .portal-url-container {
		max-width: 18rem;
		padding: 0.5rem;
	}

	.portal-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		width: 100%;
		justify-content: flex-end;
		min-width: 0;
	}
</style>
