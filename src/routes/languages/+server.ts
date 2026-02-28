import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { langs } from '$lib/constants/langs';

interface Language {
	code: string;
	name: string;
	targets: string[];
}

// Compute once at module scope
const filteredLanguages = langs.filter((lang) => lang.code !== 'AUTO');
const targetLanguages = filteredLanguages.map((lang) => lang.code.toLowerCase());
const languageList: Language[] = filteredLanguages.map((lang) => ({
	code: lang.code.toLowerCase(),
	name: lang.name,
	targets: targetLanguages
}));

export const GET: RequestHandler = async () => {
	return json(languageList, {
		status: 200,
		headers: {
			'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
		}
	});
};
