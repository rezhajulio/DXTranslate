// @vitest-environment node
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { translate, type TranslateResult } from './translate';
import axios, { AxiosError } from 'axios';

vi.mock('axios');
vi.mock('https', () => ({
	default: {
		Agent: class MockAgent {
			constructor() {
				return {};
			}
		}
	}
}));
vi.mock('crypto', () => ({
	default: {
		constants: {
			defaultCipherList: 'CIPHER1:CIPHER2:CIPHER3:CIPHER4:CIPHER5'
		}
	}
}));

const mockedAxios = axios as unknown as { post: Mock };

describe('translate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
	});

	it('builds correct request payload', async () => {
		mockedAxios.post = vi.fn().mockResolvedValue({
			data: {
				result: {
					lang: 'EN',
					lang_is_confident: true,
					texts: [{ text: 'Hello', alternatives: [] }]
				}
			}
		});

		await translate('Hallo', 'DE', 'EN', 3);

		expect(mockedAxios.post).toHaveBeenCalledTimes(1);
		const [url, body, config] = mockedAxios.post.mock.calls[0];

		expect(url).toBe('https://www2.deepl.com/jsonrpc');
		expect(config.headers).toEqual({
			'Content-Type': 'application/json',
			'Accept-Encoding': 'gzip, deflate, br'
		});

		const parsed = JSON.parse(body);
		expect(parsed.method).toBe('LMT_handle_texts');
		expect(parsed.params.texts[0].text).toBe('Hallo');
		expect(parsed.params.texts[0].requestAlternatives).toBe(3);
		expect(parsed.params.lang.source_lang_user_selected).toBe('DE');
		expect(parsed.params.lang.target_lang).toBe('EN');
	});

	it('returns correct TranslateResult shape on success', async () => {
		mockedAxios.post = vi.fn().mockResolvedValue({
			data: {
				result: {
					lang: 'DE',
					lang_is_confident: true,
					texts: [
						{
							text: 'Hello World',
							alternatives: [{ text: 'Hi World' }, { text: 'Hey World' }]
						}
					]
				}
			}
		});

		const result: TranslateResult = await translate('Hallo Welt', 'DE', 'EN');

		expect(result).toEqual({
			detectedLanguage: {
				language: 'DE',
				isConfident: true
			},
			translatedText: 'Hello World',
			alternatives: ['Hi World', 'Hey World']
		});
	});

	it('429 error maps to friendly rate-limit message', async () => {
		const axiosError = new AxiosError('Request failed');
		axiosError.response = {
			status: 429,
			statusText: 'Too Many Requests',
			headers: {},
			config: {} as never,
			data: {}
		};

		mockedAxios.post = vi.fn().mockRejectedValue(axiosError);

		await expect(translate('test')).rejects.toThrow(
			"Hmmm... looks like this server gettin' a bit too popular and making too many requests to DeepL API, try again later."
		);
	});

	it('non-429 AxiosError throws err.message', async () => {
		const axiosError = new AxiosError();
		axiosError.message = 'Network Error';

		mockedAxios.post = vi.fn().mockRejectedValue(axiosError);

		await expect(translate('test')).rejects.toThrow('Network Error');
	});

	it('unknown error throws "Unknown translation error"', async () => {
		mockedAxios.post = vi.fn().mockRejectedValue('some string error');

		await expect(translate('test')).rejects.toThrow('Unknown translation error');
	});

	it('alternativeCount is passed correctly', async () => {
		mockedAxios.post = vi.fn().mockResolvedValue({
			data: {
				result: {
					lang: 'EN',
					lang_is_confident: true,
					texts: [{ text: 'Hello', alternatives: [] }]
				}
			}
		});

		await translate('Hallo', 'AUTO', 'EN', 5);

		const [, body] = mockedAxios.post.mock.calls[0];
		const parsed = JSON.parse(body);
		expect(parsed.params.texts[0].requestAlternatives).toBe(5);
	});
});
