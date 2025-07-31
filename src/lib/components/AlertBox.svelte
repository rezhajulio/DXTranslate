<script lang="ts">
	import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-svelte';

	export let variant: 'success' | 'warning' | 'info' | 'danger' = 'info';
	export let title: string = '';
	export let description: string = '';

	const iconMap = {
		success: CheckCircle2,
		warning: AlertTriangle,
		info: Info,
		danger: XCircle
	};

	const colorMap = {
		success: 'var(--pico-color-lime-600)',
		warning: 'var(--pico-color-amber-600)',
		info: 'var(--pico-color-sky-600)',
		danger: 'var(--pico-color-red-600)'
	};

	$: Icon = iconMap[variant];
	$: accentColor = colorMap[variant];
</script>

<article class="alert" style:--accent={accentColor} data-variant={variant} role="alert">
	<Icon size={20} strokeWidth={2} color={accentColor} style="margin-top: 0.25rem;" />
	<div>
		<strong>{title}</strong>
		<p>{description}</p>
	</div>
</article>

<style>
	.alert {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.75rem;
		border-left: 4px solid var(--accent);
		border-radius: var(--pico-border-radius);
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.alert[data-variant='success'] {
		background-color: var(--pico-color-lime-150);
		color: var(--pico-color-lime-900);
	}
	.alert[data-variant='warning'] {
		background-color: var(--pico-color-amber-150);
		color: var(--pico-color-amber-900);
	}
	.alert[data-variant='info'] {
		background-color: var(--pico-color-sky-150);
		color: var(--pico-color-sky-900);
	}
	.alert[data-variant='danger'] {
		background-color: var(--pico-color-red-150);
		color: var(--pico-color-red-900);
	}
	.alert strong {
		display: block;
		margin-bottom: 0.25rem;
	}
	.alert p {
		margin: 0;
		color: inherit;
	}
</style>
