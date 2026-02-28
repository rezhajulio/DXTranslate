<script lang="ts">
	import { X } from 'lucide-svelte';
	import debounce from '$lib/actions/debounce';
	import { createEventDispatcher } from 'svelte';

	const MAX_LENGTH = 10000;
	const WARN_THRESHOLD = 9000;

	const dispatch = createEventDispatcher<{ 'dx-input': { value: string } }>();
	export let value = '';

	function handleValue() {
		dispatch('dx-input', { value });
	}

	$: isOverLimit = value.length > WARN_THRESHOLD;
</script>

<div class="dx-textarea-input">
	<textarea
		use:debounce={{ value, func: handleValue, duration: 600 }}
		bind:value
		placeholder="Enter text here to translate..."
		aria-label="Translate text input"
	></textarea>
	{#if value}
		<button
			type="button"
			class="delete-button"
			aria-label="Clear input"
			on:click={() => {
				value = '';
				handleValue();
			}}
		>
			<X size="24" />
		</button>
	{/if}
	<div class="char-counter" class:over-limit={isOverLimit}>
		{value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
	</div>
</div>

<style scoped>
	.dx-textarea-input {
		position: relative;
		height: 100%;
	}

	textarea {
		resize: none;
		margin: 0;
		height: 100%;
		padding-right: 2.5rem;
	}

	.delete-button {
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

	.delete-button:focus {
		box-shadow: none;
	}

	.delete-button:hover {
		color: var(--pico-contrast);
	}

	.char-counter {
		position: absolute;
		bottom: 0.5rem;
		right: 0.75rem;
		font-size: 0.8em;
		color: var(--pico-muted-color);
		text-align: right;
		pointer-events: none;
	}

	.char-counter.over-limit {
		color: var(--pico-color-red-600);
	}
</style>
