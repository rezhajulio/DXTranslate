<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';
	import Alternatives from './Alternatives.svelte';

	export let isLoading = false;
	export let value = '';
	export let alternatives: string[];

	let copied = false;

	async function copyToClipboard() {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="dx-textarea">
	<textarea aria-label="Translation result" {value} readonly></textarea>
	{#if value}
		<button
			type="button"
			class="copy-button"
			aria-label={copied ? 'Copied!' : 'Copy translation'}
			on:click={copyToClipboard}
		>
			{#if copied}
				<Check size={20} />
			{:else}
				<Copy size={20} />
			{/if}
		</button>
	{/if}
	<Alternatives {alternatives} />
	<div class={isLoading ? 'loading' : ''}></div>
</div>

<style scoped>
	.dx-textarea {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.dx-textarea textarea {
		margin: 0;
		resize: none;
		flex-grow: 1;
		padding-right: 2.5rem;
	}

	.copy-button {
		position: absolute;
		top: 0.25rem;
		right: 0.5rem;
		color: var(--pico-muted-color);
		cursor: pointer;
		z-index: 1;
		background: transparent;
		border: none;
		padding: 0.6rem;
		outline: none;
	}

	.copy-button:focus {
		box-shadow: none;
	}

	.copy-button:hover {
		color: var(--pico-contrast);
	}

	/* From Uiverse.io by satyamchaudharydev */
	.loading {
		display: block;
		--height-of-loader: 4px;
		--loader-color: #0071e2;
		height: var(--height-of-loader);
		border-radius: 30px;
		background-color: rgba(0, 0, 0, 0.2);
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
	}

	.loading::before {
		content: '';
		position: absolute;
		background: var(--loader-color);
		top: 0;
		left: 0;
		width: 0%;
		height: 100%;
		border-radius: 30px;
		animation: moving 1s ease-in-out infinite;
	}

	@keyframes moving {
		50% {
			width: 100%;
		}

		100% {
			width: 0;
			right: 0;
			left: unset;
		}
	}
</style>
