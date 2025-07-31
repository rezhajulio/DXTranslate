<script lang="ts">
	import { X } from 'lucide-svelte';
	import debounce from '$lib/actions/debounce';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let value = '';

	function handleValue() {
		dispatch('dx-input', { value });
	}
</script>

<div class="dx-textarea-input">
	<textarea
		use:debounce={{ value, func: handleValue, duration: 600 }}
		bind:value
		placeholder="Enter text here to translate..."
		aria-label="Translate text input"
	></textarea>
	{#if value}
		<button class="delete-button" on:click={() => (value = '')}>
			<X size="24" aria-label="clear" />
		</button>
	{/if}
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
</style>
