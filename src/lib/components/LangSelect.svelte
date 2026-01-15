<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Langs } from '$lib/constants/langs';

	export let value = '';
	export let langs: Langs[];
	export let detectedLang = '';
	export let label = '';

	const dispatch = createEventDispatcher<{ change: string }>();

	function getLang(langCode: string) {
		return langs.find((lang) => lang.code === langCode)?.name ?? '';
	}

	function getOptionLabel(lang: Langs): string {
		if (lang.code === 'AUTO' && detectedLang) {
			return `${lang.name} (${getLang(detectedLang)})`;
		}
		return lang.name;
	}

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		dispatch('change', target.value);
	}
</script>

<select aria-label={label} bind:value on:change={handleChange} required>
	{#each langs as lang}
		<option value={lang.code}>{getOptionLabel(lang)}</option>
	{/each}
</select>
