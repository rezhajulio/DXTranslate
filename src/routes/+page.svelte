<script lang="ts">
	import { ArrowRightLeft } from 'lucide-svelte';
	import { langs } from '$lib/constants/langs';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { TranslateResult } from '$lib/translate';
	import LangSelect from '$lib/components/LangSelect.svelte';
	import DxTextareaInput from '$lib/components/DXTextareaInput.svelte';
	import DxTextareaResult from '$lib/components/DXTextareaResult.svelte';
	import AlertBox from '$lib/components/AlertBox.svelte';

	let text = '';
	let translatedText = '';
	let alternatives: string[] = [];
	let detectedLang = '';
	let isLoading = false;
	let errorMsg = '';
	let abortController: AbortController | null = null;

	// Placeholder nilai awal
	let source_lang = writable('');
	let target_lang = writable('');

	onMount(() => {
		// Initialize values from localStorage on the client-side
		source_lang.set(localStorage.getItem('source_lang') || 'AUTO');
		target_lang.set(localStorage.getItem('target_lang') || 'EN');
		
		// Sync language data with localStorage
		source_lang.subscribe((value) => localStorage.setItem('source_lang', value));
		target_lang.subscribe((value) => localStorage.setItem('target_lang', value));
	});

	async function getTranslate() {
		// Abort any pending request to prevent race conditions
		if (abortController) {
			abortController.abort();
		}

		if (!text) {
			detectedLang = '';
			translatedText = '';
			alternatives = [];
			errorMsg = '';
			return false;
		}

		isLoading = true;
		abortController = new AbortController();

		const body = {
			source: $source_lang,
			target: $target_lang,
			q: text
		};

		try {
			const res = await fetch('/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(body),
				signal: abortController.signal
			});
			const data: TranslateResult = await res.json();

			if (!res.ok) {
				throw new Error(data?.error || 'Hmmm... this is not right, if this error persists, please file a bug report');
			}

			errorMsg = '';
			translatedText = data.translatedText;
			detectedLang = data.detectedLanguage.language;
			alternatives = data.alternatives;
			isLoading = false;
		} catch (error: unknown) {
			// Ignore aborted requests
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.error(message);
			errorMsg = message;
			isLoading = false;
		}
	}

	function swapLangHandler() {
		if ($source_lang.toUpperCase() === 'AUTO') {
			$source_lang = detectedLang || 'EN';
		}
		[$source_lang, $target_lang] = [$target_lang, $source_lang];
		[text, translatedText] = [translatedText, text];
	}
</script>

<div>
	{#if errorMsg}
		<AlertBox
			variant="danger"
			title="Translation Error"
			description={errorMsg}
		/>
	{/if}
	<div class="lang-select">
		<LangSelect
			label="Source language"
			bind:value={$source_lang}
			on:change={getTranslate}
			{detectedLang}
			{langs}
		/>
		<button
			on:click={swapLangHandler}
			disabled={$source_lang === 'AUTO' && !detectedLang}
			class="swap-button"
			title="Swap language"
		>
			<ArrowRightLeft class="icon" size="32" />
		</button>
		<LangSelect
			label="Target language"
			bind:value={$target_lang}
			on:change={getTranslate}
			langs={langs.slice(1)}
		/>
	</div>
	<div class="grid dxtranslate-form">
		<DxTextareaInput bind:value={text} on:dx-input={(e) => getTranslate()} />
		<DxTextareaResult value={translatedText} {alternatives} {isLoading} />
	</div>
</div>

<style scoped>
	.lang-select {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.swap-button {
		margin-bottom: var(--pico-spacing);
		background: transparent;
		color: var(--pico-muted-color);
		border: none;
	}

	.dxtranslate-form {
		gap: 0;
		height: 360px;
	}

	@media (max-width: 768px) {
		.dxtranslate-form {
			height: 512px;
		}
	}
</style>
