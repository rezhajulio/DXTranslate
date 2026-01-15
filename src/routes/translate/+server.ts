import { translate } from '$lib/translate';
import { langs } from '$lib/constants/langs';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

const VALID_LANG_CODES = new Set(langs.map((l) => l.code));
const MAX_TEXT_LENGTH = 10000;
const MAX_BATCH_SIZE = 10;
const MAX_ALTERNATIVES = 5;

function isValidLangCode(code: unknown): code is string {
	return typeof code === 'string' && VALID_LANG_CODES.has(code.toUpperCase());
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (typeof body !== 'object' || body === null) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { source, target, q, alternatives } = body as Record<string, unknown>;

	if (!target || !isValidLangCode(target)) {
		return json({ error: 'Invalid or missing target language' }, { status: 400 });
	}
	if (source && !isValidLangCode(source)) {
		return json({ error: 'Invalid source language' }, { status: 400 });
	}
	if (!q) {
		return json({ error: "Text can't be empty" }, { status: 400 });
	}

	const altCount = Math.min(Math.max(0, Number(alternatives) || 3), MAX_ALTERNATIVES);

	try {
		if (Array.isArray(q)) {
			if (q.length > MAX_BATCH_SIZE) {
				return json({ error: `Maximum batch size is ${MAX_BATCH_SIZE}` }, { status: 400 });
			}

			for (const text of q) {
				if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) {
					return json(
						{ error: `Each text must be a string with max ${MAX_TEXT_LENGTH} characters` },
						{ status: 400 }
					);
				}
			}

			const results = await Promise.all(
				q.map((text: string) =>
					translate(text, (source as string) ?? 'AUTO', target.toUpperCase(), altCount)
				)
			);
			return json({
				detectedLanguage: results.map((r) => r.detectedLanguage),
				translatedText: results.map((r) => r.translatedText),
				alternatives: results.map((r) => r.alternatives)
			});
		} else {
			if (typeof q !== 'string') {
				return json({ error: 'Text must be a string' }, { status: 400 });
			}
			if (q.length > MAX_TEXT_LENGTH) {
				return json({ error: `Text must be max ${MAX_TEXT_LENGTH} characters` }, { status: 400 });
			}

			const result = await translate(
				q,
				(source as string) ?? 'AUTO',
				target.toUpperCase(),
				altCount
			);
			return json(result);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Translation failed';
		console.error('Translation error:', message);
		return json({ error: message }, { status: 500 });
	}
};
