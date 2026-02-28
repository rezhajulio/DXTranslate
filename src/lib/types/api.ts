export interface TranslateResult {
	detectedLanguage: {
		language: string;
		isConfident: boolean;
	};
	translatedText: string;
	alternatives: string[];
}

export interface TranslateRequest {
	source?: string;
	target: string;
	q: string | string[];
	alternatives?: number;
}

export interface TranslateErrorResponse {
	error: string;
}
