// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';

vi.mock('$lib/server/translate', () => ({
	translate: vi.fn()
}));

import { translate } from '$lib/server/translate';

const mockTranslate = vi.mocked(translate);

function createRequest(body: unknown, options?: { invalidJson?: boolean; contentLength?: number }): Request {
	if (options?.invalidJson) {
		return new Request('http://localhost/translate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(options.contentLength ? { 'Content-Length': String(options.contentLength) } : {})
			},
			body: 'invalid json{'
		});
	}
	const bodyStr = JSON.stringify(body);
	return new Request('http://localhost/translate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(options?.contentLength ? { 'Content-Length': String(options.contentLength) } : {})
		},
		body: bodyStr
	});
}

async function callPOST(body: unknown, options?: { invalidJson?: boolean; contentLength?: number }) {
	const request = createRequest(body, options);
	return POST({ request } as Parameters<typeof POST>[0]);
}

describe('POST /translate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTranslate.mockResolvedValue({
			detectedLanguage: { language: 'EN', isConfident: true },
			translatedText: 'translated',
			alternatives: []
		});
	});

	it('returns 413 for oversized request body', async () => {
		const response = await callPOST({ q: 'hello', target: 'en' }, { contentLength: 200000 });
		expect(response.status).toBe(413);
		expect(await response.json()).toEqual({ error: 'Request body too large' });
	});

	it('returns 400 for invalid JSON body', async () => {
		const response = await callPOST(null, { invalidJson: true });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
	});

	it('returns 400 when body is null', async () => {
		const response = await callPOST(null);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid request body' });
	});

	it('returns 400 when body is a string', async () => {
		const request = new Request('http://localhost/translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify('just a string')
		});
		const response = await POST({ request } as Parameters<typeof POST>[0]);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid request body' });
	});

	it('returns 400 when target is missing', async () => {
		const response = await callPOST({ q: 'hello' });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid or missing target language' });
	});

	it('returns 400 for invalid target language code', async () => {
		const response = await callPOST({ q: 'hello', target: 'INVALID' });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid or missing target language' });
	});

	it('returns 400 for invalid source language code', async () => {
		const response = await callPOST({ q: 'hello', target: 'en', source: 'INVALID' });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid source language' });
	});

	it('returns 400 when q is missing', async () => {
		const response = await callPOST({ target: 'en' });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Text can't be empty" });
	});

	it('returns 400 when q is not a string', async () => {
		const response = await callPOST({ target: 'en', q: 123 });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Text must be a string' });
	});

	it('returns 400 when q exceeds max length', async () => {
		const response = await callPOST({ target: 'en', q: 'a'.repeat(10001) });
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Text must be max 10000 characters' });
	});

	it('returns 400 when batch q array exceeds max size', async () => {
		const response = await callPOST({
			target: 'en',
			q: Array(11).fill('hello')
		});
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Maximum batch size is 10' });
	});

	it('clamps negative alternatives to 0', async () => {
		await callPOST({ target: 'en', q: 'hello', alternatives: -5 });
		expect(mockTranslate).toHaveBeenCalledWith('hello', 'AUTO', 'EN', 0);
	});

	it('clamps alternatives > 5 to 5', async () => {
		await callPOST({ target: 'en', q: 'hello', alternatives: 10 });
		expect(mockTranslate).toHaveBeenCalledWith('hello', 'AUTO', 'EN', 5);
	});

	it('defaults alternatives to 3 when missing', async () => {
		await callPOST({ target: 'en', q: 'hello' });
		expect(mockTranslate).toHaveBeenCalledWith('hello', 'AUTO', 'EN', 3);
	});

	it('uppercases target language', async () => {
		await callPOST({ target: 'fr', q: 'hello' });
		expect(mockTranslate).toHaveBeenCalledWith('hello', 'AUTO', 'FR', 3);
	});

	it('returns generic 500 message when translate throws', async () => {
		mockTranslate.mockRejectedValue(new Error('API down'));
		const response = await callPOST({ target: 'en', q: 'hello' });
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: 'Translation failed. Please try again later.' });
	});

	it('passes through rate limit error with 429 status', async () => {
		mockTranslate.mockRejectedValue(
			new Error("Hmmm... looks like this server gettin' a bit too popular and making too many requests to DeepL API, try again later.")
		);
		const response = await callPOST({ target: 'en', q: 'hello' });
		expect(response.status).toBe(429);
		const data = await response.json();
		expect(data.error).toContain('too many requests');
	});

	it('returns translation result on success', async () => {
		mockTranslate.mockResolvedValue({
			detectedLanguage: { language: 'EN', isConfident: true },
			translatedText: 'bonjour',
			alternatives: ['salut']
		});
		const response = await callPOST({ target: 'fr', q: 'hello' });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			detectedLanguage: { language: 'EN', isConfident: true },
			translatedText: 'bonjour',
			alternatives: ['salut']
		});
	});

	it('handles batch translation', async () => {
		mockTranslate
			.mockResolvedValueOnce({
				detectedLanguage: { language: 'EN', isConfident: true },
				translatedText: 'bonjour',
				alternatives: []
			})
			.mockResolvedValueOnce({
				detectedLanguage: { language: 'EN', isConfident: true },
				translatedText: 'monde',
				alternatives: []
			});

		const response = await callPOST({ target: 'fr', q: ['hello', 'world'] });
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			detectedLanguage: [
				{ language: 'EN', isConfident: true },
				{ language: 'EN', isConfident: true }
			],
			translatedText: ['bonjour', 'monde'],
			alternatives: [[], []]
		});
	});
});
