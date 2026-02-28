import axios, { AxiosError } from 'axios';
import https from 'https';
import crypto from 'crypto';
import type { TranslateResult } from '$lib/types/api';

export type { TranslateResult };

const DEEPL_BASE_URL = process.env.DEEPL_BASE_URL ?? 'https://www2.deepl.com/jsonrpc';
const REQUEST_TIMEOUT = 10_000;

const headers = {
	'Content-Type': 'application/json',
	'Accept-Encoding': 'gzip, deflate, br'
};

// Shuffle ciphers once at module load for TLS fingerprint variation
function createHttpsAgent(): https.Agent {
	const defaultCiphers = crypto.constants.defaultCipherList.split(':');
	const shuffledCiphers = [
		...defaultCiphers.slice(0, 3),
		...defaultCiphers
			.slice(3)
			.map((c: string) => ({ cipher: c, sort: Math.random() }))
			.sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort)
			.map((o: { cipher: string }) => o.cipher)
	].join(':');

	return new https.Agent({
		ciphers: shuffledCiphers,
		keepAlive: true
	});
}

const httpsAgent = createHttpsAgent();

function getICount(translateText: string): number {
	return (translateText || '').split('i').length - 1;
}

function getRandomNumber(): number {
	const id = Math.floor(Math.random() * (8399998 - 8300000 + 1)) + 8300000;
	return id * 1000;
}

function getTimestamp(iCount: number): number {
	const ts = Date.now();
	if (iCount === 0) {
		return ts;
	}
	iCount++;
	return ts - (ts % iCount) + iCount;
}

export async function translate(
	text = 'Error: The original text cannot be empty!',
	sourceLang = 'AUTO',
	targetLang = 'EN',
	alternativeCount = 0
): Promise<TranslateResult> {
	const iCount = getICount(text);
	const id = getRandomNumber();

	const postData = {
		jsonrpc: '2.0',
		method: 'LMT_handle_texts',
		id,
		params: {
			texts: [{ text, requestAlternatives: alternativeCount }],
			splitting: 'newlines',
			lang: {
				source_lang_user_selected: sourceLang,
				target_lang: targetLang
			},
			timestamp: getTimestamp(iCount)
		}
	};

	let postDataStr = JSON.stringify(postData);

	if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
		postDataStr = postDataStr.replace('"method":"', '"method" : "');
	} else {
		postDataStr = postDataStr.replace('"method":"', '"method": "');
	}

	try {
		const response = await axios.post(DEEPL_BASE_URL, postDataStr, {
			headers,
			httpsAgent,
			timeout: REQUEST_TIMEOUT
		});

		const resultData = response.data?.result;
		if (!resultData?.texts?.[0]) {
			throw new Error('Unexpected response from translation service');
		}

		const result: TranslateResult = {
			detectedLanguage: {
				language: resultData.lang,
				isConfident: resultData.lang_is_confident
			},
			translatedText: resultData.texts[0].text,
			alternatives: (resultData.texts[0].alternatives ?? []).map(
				(alternative: { text: string }) => alternative.text
			)
		};

		return result;
	} catch (err: unknown) {
		if (err instanceof AxiosError) {
			const { response } = err;
			if (response) {
				if (response.status === 429) {
					throw new Error(
						`Hmmm... looks like this server gettin' a bit too popular and making too many requests to DeepL API, try again later.`
					);
				}
			}

			throw new Error(err.message);
		}

		throw new Error(err instanceof Error ? err.message : 'Unknown translation error');
	}
}
