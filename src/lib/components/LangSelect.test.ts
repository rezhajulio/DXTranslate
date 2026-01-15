import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import LangSelect from './LangSelect.svelte';
import type { Langs } from '$lib/constants/langs';

const mockLangs: Langs[] = [
	{ code: 'AUTO', name: 'Auto' },
	{ code: 'EN', name: 'English' },
	{ code: 'FR', name: 'French' },
	{ code: 'DE', name: 'German' }
];

describe('LangSelect', () => {
	it('renders all language options', () => {
		const { getAllByRole } = render(LangSelect, {
			props: { langs: mockLangs, label: 'Select language' }
		});

		const options = getAllByRole('option');
		expect(options).toHaveLength(4);
		expect(options[0]).toHaveTextContent('Auto');
		expect(options[1]).toHaveTextContent('English');
		expect(options[2]).toHaveTextContent('French');
		expect(options[3]).toHaveTextContent('German');
	});

	it('AUTO label includes detected language when detectedLang is set', () => {
		const { getByRole } = render(LangSelect, {
			props: { langs: mockLangs, label: 'Select language', detectedLang: 'EN' }
		});

		const autoOption = getByRole('option', { name: 'Auto (English)' });
		expect(autoOption).toBeInTheDocument();
	});

	it('dispatches change event with selected value when changed', async () => {
		const changeSpy = vi.fn();
		const { getByLabelText, component } = render(LangSelect, {
			props: { langs: mockLangs, label: 'Select language' }
		});

		component.$on('change', changeSpy);

		const select = getByLabelText('Select language');
		await fireEvent.change(select, { target: { value: 'FR' } });

		expect(changeSpy).toHaveBeenCalledTimes(1);
		expect(changeSpy.mock.calls[0][0].detail).toBe('FR');
	});

	it('select is accessible via aria-label', () => {
		const { getByLabelText } = render(LangSelect, {
			props: { langs: mockLangs, label: 'Source language' }
		});

		const select = getByLabelText('Source language');
		expect(select).toBeInTheDocument();
		expect(select.tagName).toBe('SELECT');
	});

	it('disabled prop disables the select', () => {
		const { getByLabelText } = render(LangSelect, {
			props: { langs: mockLangs, label: 'Select language', disabled: true }
		});

		const select = getByLabelText('Select language');
		expect(select).toBeDisabled();
	});
});
