import { test, expect } from '@playwright/test';

test.describe('Translation App', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
	});

	test.describe('Happy path translation flow', () => {
		test('should translate text and display result', async ({ page }) => {
			await page.route('**/translate', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						translatedText: 'Hola mundo',
						detectedLanguage: { language: 'EN' },
						alternatives: ['Hola universo']
					})
				});
			});

			await page.goto('/');

			const inputTextarea = page.locator('textarea[aria-label="Translate text input"]');
			await inputTextarea.fill('Hello world');

			const resultTextarea = page.locator('textarea[aria-label="Translation result"]');
			await expect(resultTextarea).toHaveValue('Hola mundo', { timeout: 5000 });
		});
	});

	test.describe('Error handling', () => {
		test('should display error alert when translation fails', async ({ page }) => {
			await page.route('**/translate', async (route) => {
				await route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({
						error: 'Translation service unavailable'
					})
				});
			});

			await page.goto('/');

			const inputTextarea = page.locator('textarea[aria-label="Translate text input"]');
			await inputTextarea.fill('Hello world');

			const alertBox = page.locator('article[role="alert"][data-variant="danger"]');
			await expect(alertBox).toBeVisible({ timeout: 5000 });
			await expect(alertBox).toContainText('Translation Error');
			await expect(alertBox).toContainText('Translation service unavailable');
		});
	});

	test.describe('Language persistence', () => {
		test('should persist language selections in localStorage', async ({ page }) => {
			await page.goto('/');

			const sourceSelect = page.locator('select[aria-label="Source language"]');
			const targetSelect = page.locator('select[aria-label="Target language"]');

			await sourceSelect.selectOption('DE');
			await targetSelect.selectOption('FR');

			const storedSource = await page.evaluate(() => localStorage.getItem('source_lang'));
			const storedTarget = await page.evaluate(() => localStorage.getItem('target_lang'));
			expect(storedSource).toBe('DE');
			expect(storedTarget).toBe('FR');

			await page.reload();

			await expect(sourceSelect).toHaveValue('DE');
			await expect(targetSelect).toHaveValue('FR');
		});

		test('should use default languages when localStorage is empty', async ({ page }) => {
			await page.goto('/');

			const sourceSelect = page.locator('select[aria-label="Source language"]');
			const targetSelect = page.locator('select[aria-label="Target language"]');

			await expect(sourceSelect).toHaveValue('AUTO');
			await expect(targetSelect).toHaveValue('EN');
		});
	});
});
