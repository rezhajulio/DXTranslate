<script lang="ts">
	import { MonitorCog, Moon, Sun, SwatchBook } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import clickOutside from '$lib/actions/clickOutside';

	type ThemeOptions = 'system' | 'light' | 'dark';
	let theme: ThemeOptions = 'system';
	let isExpanded = false;

	const themeOptions: { value: ThemeOptions; label: string; icon: typeof MonitorCog }[] = [
		{ value: 'system', label: 'System', icon: MonitorCog },
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon }
	];

	function changeTheme(selectedTheme: ThemeOptions) {
		theme = selectedTheme;
		isExpanded = false;

		if (browser) {
			if (theme === 'system') {
				document.documentElement.removeAttribute('data-theme');
				localStorage.removeItem('theme');
			} else {
				document.documentElement.setAttribute('data-theme', theme);
				localStorage.setItem('theme', theme);
			}
		}
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		const items = Array.from(
			(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(
				'[role="menuitemradio"]'
			)
		);
		const currentIndex = items.indexOf(event.target as HTMLButtonElement);

		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault();
				const next = (currentIndex + 1) % items.length;
				items[next].focus();
				break;
			}
			case 'ArrowUp': {
				event.preventDefault();
				const prev = (currentIndex - 1 + items.length) % items.length;
				items[prev].focus();
				break;
			}
			case 'Home':
				event.preventDefault();
				items[0].focus();
				break;
			case 'End':
				event.preventDefault();
				items[items.length - 1].focus();
				break;
		}
	}

	function toggleMenu() {
		isExpanded = !isExpanded;
		if (isExpanded) {
			requestAnimationFrame(() => {
				const selected = document.querySelector<HTMLButtonElement>(
					'.theme-menu [aria-checked="true"]'
				);
				selected?.focus();
			});
		}
	}

	onMount(() => {
		const initialTheme = localStorage.getItem('theme') || '';
		if (initialTheme) document.documentElement.setAttribute('data-theme', initialTheme);
	});
</script>

<div use:clickOutside={() => (isExpanded = false)} class="dropdown">
	<button
		aria-label="Switch theme"
		aria-haspopup="true"
		aria-expanded={isExpanded}
		type="button"
		class="theme-button"
		on:click={toggleMenu}
	>
		<SwatchBook />
	</button>
	{#if isExpanded}
		<ul class="theme-menu" role="menu" on:keydown={handleMenuKeydown}>
			{#each themeOptions as option (option.value)}
				<li role="none">
					<button
						role="menuitemradio"
						aria-checked={theme === option.value}
						type="button"
						class="theme-menu-item"
						on:click={() => changeTheme(option.value)}
					>
						<svelte:component this={option.icon} size={20} />
						<span>{option.label}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
	}

	.theme-button {
		background: transparent;
		color: var(--pico-muted-color);
		border: none;
		margin: 0;
		padding: 0;
	}

	.theme-button:focus {
		outline: 0;
		box-shadow: none;
	}

	.theme-button:is(:hover, :focus-visible, .active) {
		color: var(--pico-contrast);
	}

	.theme-menu {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: start;
		z-index: 10;
		background-color: var(--pico-dropdown-background-color);
		border: 1px solid var(--pico-dropdown-border-color);
		right: 0;
		top: 36px;
		padding: 0;
		margin: 0;
		list-style: none;
	}

	.theme-menu li {
		width: 100%;
		padding: 0;
		margin: 0;
	}

	.theme-menu-item {
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 8px;
		cursor: pointer;
		padding: 0.6rem 0.8rem;
		user-select: none;
		width: 100%;
		background: transparent;
		border: none;
		color: inherit;
		font-size: inherit;
		margin: 0;
	}

	.theme-menu-item:focus {
		outline: 2px solid var(--pico-primary);
		outline-offset: -2px;
		box-shadow: none;
	}

	.theme-menu-item[aria-checked='true'] {
		background-color: var(--pico-form-element-selected-background-color);
	}
</style>
