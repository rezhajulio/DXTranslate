<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';

	export let alternatives: string[];

	let copiedIndex: number | null = null;

	async function copyAlternative(text: string, index: number) {
		try {
			await navigator.clipboard.writeText(text);
			copiedIndex = index;
			setTimeout(() => (copiedIndex = null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="dx-alternatives">
	{#if alternatives.length}
		<div class="dx-alternatives-container">
			<h4 class="dx-alternatives-title">Alternatives :</h4>
			{#each alternatives as alt, i}
				<div class="dx-alternatives-item">
					<p class="dx-alternatives-text">{alt}</p>
					<button
						type="button"
						class="copy-alt-button"
						aria-label={copiedIndex === i ? 'Copied!' : 'Copy alternative'}
						on:click={() => copyAlternative(alt, i)}
					>
						{#if copiedIndex === i}
							<Check size={14} />
						{:else}
							<Copy size={14} />
						{/if}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style scoped>
	.dx-alternatives-container {
		border: 1px solid var(--pico-form-element-border-color);
		border-right: 0;
		border-bottom: 0;
		background-color: var(--pico-form-element-background-color);
		width: 100%;
		padding: 0.4rem 1.2rem 1rem 1.2rem;
		max-height: 200px;
		overflow: auto;
	}

	.dx-alternatives-title {
		font-size: 1em;
		color: var(--pico-muted-color);
		margin-left: 0;
		padding-top: 0.4rem;
	}

	.dx-alternatives-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dx-alternatives-text {
		margin: 0.2rem 0;
		flex: 1;
	}

	.copy-alt-button {
		color: var(--pico-muted-color);
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0.25rem;
		outline: none;
		flex-shrink: 0;
	}

	.copy-alt-button:focus {
		box-shadow: none;
	}

	.copy-alt-button:hover {
		color: var(--pico-contrast);
	}
</style>
