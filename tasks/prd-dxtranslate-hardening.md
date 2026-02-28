# PRD: DXTranslate Comprehensive Hardening

## Introduction

DXTranslate is a lightweight SvelteKit 4 frontend translator that proxies requests to DeepL's internal JSONRPC API. An Oracle-driven review of the entire codebase identified improvements across security, accessibility, UX, code quality, testing, and developer experience. This PRD covers all identified improvements, organized into three phases that can be implemented independently and sequentially.

- **Phase 1: Security & Reliability** — Protect the app from abuse, prevent information leaks, and improve upstream resilience.
- **Phase 2: Accessibility & UX** — Fix keyboard navigation, ARIA semantics, and improve the translation experience.
- **Phase 3: Code Quality, Testing & DX** — Fix type mismatches, harden CI, and improve developer ergonomics.

**Target deployment:** Vercel (may use Vercel-specific features).
**Framework:** Svelte 4 (no Svelte 5 migration in scope).

## Goals

- Harden the public-facing translation proxy against abuse and information leaks
- Achieve WCAG 2.1 AA compliance for all interactive components
- Fix all known type mismatches between production code and test mocks
- Add lint and typecheck gates to CI to prevent regressions
- Improve UX with character limits, loading feedback, and smarter swap behavior
- Keep the app lightweight and fast — no heavy new dependencies

---

# Phase 1: Security & Reliability

## User Stories

### US-101: Add request timeout to DeepL API calls
**Description:** As a system operator, I want upstream HTTP requests to time out so that a hung DeepL endpoint doesn't tie up serverless invocations indefinitely.

**Acceptance Criteria:**
- [ ] `axios.post()` call in `src/lib/translate.ts` includes `timeout: 10_000` (10 seconds)
- [ ] When the timeout is exceeded, the error is caught and a user-friendly message is returned (not raw axios internals)
- [ ] Add a unit test in `src/lib/translate.test.ts` that verifies timeout behavior (mock a delayed response)
- [ ] `pnpm test:unit` passes

### US-102: Move DeepL client to server-only path
**Description:** As a developer, I want the DeepL client module to be importable only from server-side code so that Node.js-only dependencies (`https`, `crypto`) never accidentally leak into client bundles.

**Acceptance Criteria:**
- [ ] `src/lib/translate.ts` is moved to `src/lib/server/translate.ts`
- [ ] `src/lib/translate.test.ts` is moved to `src/lib/server/translate.test.ts`
- [ ] `src/routes/translate/+server.ts` import updated to `$lib/server/translate`
- [ ] `src/routes/translate/server.test.ts` import updated to `$lib/server/translate`
- [ ] No other files import from the old path
- [ ] `pnpm test:unit` passes

### US-103: Sanitize error responses on /translate endpoint
**Description:** As a security-conscious developer, I want the `/translate` endpoint to return generic error messages for 500 errors so that internal details (network errors, stack traces, upstream URLs) are never exposed to clients.

**Acceptance Criteria:**
- [ ] In `src/routes/translate/+server.ts`, the catch block (lines 82–86) logs the full error server-side via `console.error`
- [ ] The 500 JSON response returns `{ error: "Translation failed. Please try again later." }` instead of raw `error.message`
- [ ] The existing 429 rate-limit message from `translate.ts` is preserved and passed through (it's already user-friendly)
- [ ] Update `src/routes/translate/server.test.ts` test "returns 500 when translate throws" to expect the generic message
- [ ] `pnpm test:unit` passes

### US-104: Add Content-Length guard to /translate endpoint
**Description:** As a system operator, I want the `/translate` endpoint to reject oversized request bodies early so that attackers can't send massive payloads to exhaust resources.

**Acceptance Criteria:**
- [ ] In `src/routes/translate/+server.ts`, check `request.headers.get('content-length')` before parsing JSON
- [ ] If `Content-Length` exceeds 100KB (102400 bytes), return `{ error: "Request body too large" }` with status `413`
- [ ] Add a unit test verifying 413 is returned for oversized requests
- [ ] `pnpm test:unit` passes

### US-105: Add security headers via server hooks
**Description:** As a security-conscious developer, I want the app to send strict security headers on every response to prevent common web vulnerabilities.

**Acceptance Criteria:**
- [ ] Create `src/hooks.server.ts` with a `handle` hook that sets headers on all responses
- [ ] Headers set: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`
- [ ] `/translate` responses additionally include `Cache-Control: no-store`
- [ ] Verify headers appear in browser DevTools Network tab during `pnpm dev`
- [ ] `pnpm test:unit` passes (no regressions)

### US-106: Reuse HTTPS agent and add keepAlive
**Description:** As a performance-minded developer, I want the HTTPS agent to be created once at module initialization (not per-request) so that TLS handshake overhead is reduced and connections are reused.

**Acceptance Criteria:**
- [ ] In `src/lib/server/translate.ts` (after US-102 move), create the HTTPS agent at module scope with `keepAlive: true`
- [ ] Cipher shuffling happens once at module load, not per request
- [ ] `getHttpsAgent()` is removed; the module-level agent is used directly in the `axios.post()` call
- [ ] Update `src/lib/server/translate.test.ts` mocks accordingly
- [ ] `pnpm test:unit` passes

### US-107: Add response shape validation for DeepL upstream
**Description:** As a developer, I want the `translate()` function to gracefully handle unexpected response shapes from DeepL so that users see a clear error instead of a cryptic crash.

**Acceptance Criteria:**
- [ ] In `src/lib/server/translate.ts`, use optional chaining when accessing `response.data.result.texts[0].alternatives`
- [ ] If `response.data.result` or `response.data.result.texts[0]` is missing/undefined, throw a controlled error: `"Unexpected response from translation service"`
- [ ] `alternatives` defaults to `[]` if the field is missing
- [ ] Add a unit test that mocks a malformed DeepL response and verifies the controlled error
- [ ] `pnpm test:unit` passes

### US-108: Cache /languages endpoint response
**Description:** As a performance-minded developer, I want the `/languages` endpoint to compute the language list once and return it with caching headers so that repeated requests are served instantly.

**Acceptance Criteria:**
- [ ] In `src/routes/languages/+server.ts`, compute `languageList` at module scope (outside the handler)
- [ ] Add `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` header to the response
- [ ] `pnpm test:unit` passes

## Functional Requirements (Phase 1)

- FR-101: All `axios.post()` calls to DeepL must include `timeout: 10_000`
- FR-102: The `translate` module must reside under `src/lib/server/` and must not be importable from client code
- FR-103: 500 error responses from `/translate` must not contain internal error details
- FR-104: Request bodies larger than 100KB must be rejected with HTTP 413
- FR-105: All responses must include security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`)
- FR-106: A single HTTPS agent with `keepAlive: true` must be reused across all translation requests
- FR-107: Malformed DeepL responses must produce a controlled error, not an uncaught exception
- FR-108: The `/languages` response must include cache headers with `max-age=86400`

## Non-Goals (Phase 1)

- No platform-level rate limiting (Vercel WAF) — can be configured separately in Vercel dashboard
- No in-memory rate limiting by IP — deferred; Vercel's edge rate limiting is preferred
- No official DeepL API key mode
- No Svelte 5 migration

---

# Phase 2: Accessibility & UX

## User Stories

### US-201: Fix ThemeSwitch keyboard accessibility
**Description:** As a keyboard user, I want to navigate the theme menu using keyboard so that I can switch themes without a mouse.

**Acceptance Criteria:**
- [ ] Replace `<li role="tab">` elements with `<li><button role="menuitemradio" aria-checked={selected}>` for each theme option
- [ ] Replace `<ul role="tablist">` with `<ul role="menu">`
- [ ] Remove all `svelte-ignore a11y-click-events-have-key-events` comments
- [ ] Pressing `Escape` closes the dropdown
- [ ] Pressing `Enter` or `Space` on a menu item selects it and closes the dropdown
- [ ] Focus moves to the first item when the dropdown opens
- [ ] `pnpm test:unit` passes
- [ ] Verify in browser: open dropdown with Enter, navigate with arrow keys, select with Enter, close with Escape

### US-202: Add Escape key support to clickOutside action
**Description:** As a keyboard user, I want dropdowns to close when I press Escape so that I don't get trapped in a dropdown.

**Acceptance Criteria:**
- [ ] `src/lib/actions/clickOutside.ts` adds a `keydown` listener for the `Escape` key that triggers the callback
- [ ] The `destroy()` method removes both the click and keydown listeners
- [ ] Add unit tests in `src/lib/actions/clickOutside.test.ts` verifying Escape closes, and destroy removes the keydown listener
- [ ] `pnpm test:unit` passes

### US-203: Add ARIA loading state to translation result
**Description:** As a screen reader user, I want to be informed when a translation is in progress so that I know the app is working.

**Acceptance Criteria:**
- [ ] `DXTextareaResult.svelte` result container has `aria-busy={isLoading}`
- [ ] A visually-hidden `<span>` with `aria-live="polite"` displays "Translating…" when `isLoading` is true and is empty otherwise
- [ ] The visually-hidden span uses `clip-rect` / `sr-only` style (position absolute, 1px dimensions, overflow hidden)
- [ ] `pnpm test:unit` passes
- [ ] Verify in browser: screen reader announces "Translating…" when translation is in progress

### US-204: Add character count and limit indicator
**Description:** As a user, I want to see how many characters I've typed and the maximum allowed so that I don't hit the server limit unexpectedly.

**Acceptance Criteria:**
- [ ] `DXTextareaInput.svelte` displays a character counter below the textarea: `{value.length} / 10,000`
- [ ] The counter text turns red (uses `--pico-color-red-600`) when the count exceeds 9,000 characters (warning zone)
- [ ] The counter is right-aligned and uses a small font size (`0.8em`)
- [ ] The max length constant (10000) is imported from a shared location or defined as a prop
- [ ] `pnpm test:unit` passes
- [ ] Verify in browser: counter updates as user types, turns red near limit

### US-205: Re-translate after language swap
**Description:** As a user, I want the app to automatically re-translate after swapping languages so that the result is always fresh and correct.

**Acceptance Criteria:**
- [ ] In `src/routes/+page.svelte`, `swapLangHandler()` calls `getTranslate()` after swapping languages and text
- [ ] If the swapped input text is empty, `getTranslate()` correctly clears the result (existing behavior)
- [ ] `pnpm test:unit` passes
- [ ] Verify in browser: swap languages, observe that a new translation request is made

### US-206: Add placeholder text to result textarea
**Description:** As a user, I want to see a helpful placeholder in the result textarea so that I know where the translation will appear.

**Acceptance Criteria:**
- [ ] `DXTextareaResult.svelte` textarea has `placeholder="Translation will appear here..."`
- [ ] Placeholder is only visible when `value` is empty
- [ ] `pnpm test:unit` passes
- [ ] Verify in browser: placeholder is visible when no translation has been made

## Functional Requirements (Phase 2)

- FR-201: ThemeSwitch dropdown must be fully keyboard-navigable (Escape, Enter, Space, focus management)
- FR-202: The `clickOutside` action must also respond to the Escape key
- FR-203: Screen readers must announce the loading state of translation results
- FR-204: A character counter must be visible below the input textarea, turning red above 9,000 characters
- FR-205: Language swap must trigger a new translation request
- FR-206: Result textarea must show a placeholder when empty

## Non-Goals (Phase 2)

- No full redesign or layout changes
- No new pages or routes
- No mobile-specific responsive changes beyond existing behavior
- No Svelte 5 runes migration

---

# Phase 3: Code Quality, Testing & DX

## User Stories

### US-301: Fix type mismatch in server.test.ts mocks
**Description:** As a developer, I want test mocks to match the real `TranslateResult` type so that tests catch actual regressions instead of passing with incorrect shapes.

**Acceptance Criteria:**
- [ ] In `src/routes/translate/server.test.ts`, all `mockTranslate.mockResolvedValue()` calls use the correct `TranslateResult` shape: `detectedLanguage: { language: string, isConfident: boolean }` (not a bare string)
- [ ] Batch test expectations updated to match the real shape
- [ ] `pnpm test:unit` passes

### US-302: Remove unused fields from TranslateResult
**Description:** As a developer, I want the `TranslateResult` interface to only contain fields that are actually used so that the type is accurate and not misleading.

**Acceptance Criteria:**
- [ ] Remove `message?` and `error?` fields from `TranslateResult` in `src/lib/server/translate.ts`
- [ ] Verify no code references these fields
- [ ] `pnpm test:unit` passes

### US-303: Type event dispatchers in components
**Description:** As a developer, I want event dispatchers to be typed so that event payload drift is caught at compile time.

**Acceptance Criteria:**
- [ ] `DXTextareaInput.svelte` dispatcher typed as `createEventDispatcher<{ 'dx-input': { value: string } }>()`
- [ ] `LangSelect.svelte` dispatcher is already typed — verify no changes needed
- [ ] `pnpm check` passes (svelte-check)
- [ ] `pnpm test:unit` passes

### US-304: Fix store subscription leak in +page.svelte
**Description:** As a developer, I want store subscriptions to be properly cleaned up so that the pattern doesn't cause memory leaks if reused elsewhere.

**Acceptance Criteria:**
- [ ] In `src/routes/+page.svelte`, capture the return values (unsubscribe functions) from `source_lang.subscribe()` and `target_lang.subscribe()`
- [ ] Call both unsubscribe functions in an `onDestroy()` callback
- [ ] Import `onDestroy` from `svelte`
- [ ] `pnpm test:unit` passes

### US-305: Clean up commented-out headers in translate module
**Description:** As a developer, I want dead code removed so that the codebase is clean and easy to understand.

**Acceptance Criteria:**
- [ ] Remove the commented-out header lines (lines 20–28) in the translate module
- [ ] If any context is needed for future reference, add a single-line comment explaining that browser-like headers can be added if DeepL starts blocking requests
- [ ] `pnpm test:unit` passes

### US-306: Make DeepL base URL configurable via environment variable
**Description:** As a self-hoster, I want to override the DeepL endpoint URL via an environment variable so that I can point to a proxy or alternative endpoint.

**Acceptance Criteria:**
- [ ] In `src/lib/server/translate.ts`, read `DEEPL_BASE_URL` from `process.env` with fallback to `'https://www2.deepl.com/jsonrpc'`
- [ ] The env var is documented in README under a new "Configuration" section
- [ ] `pnpm test:unit` passes

### US-307: Create shared API types
**Description:** As a developer, I want client and server to share the same request/response type definitions so that API contracts are enforced at compile time.

**Acceptance Criteria:**
- [ ] Create `src/lib/types/api.ts` with:
  - `TranslateRequest` type: `{ source?: string; target: string; q: string | string[]; alternatives?: number }`
  - `TranslateResponse` type: `{ detectedLanguage: { language: string; isConfident: boolean }; translatedText: string; alternatives: string[] }`
  - `TranslateBatchResponse` type: `{ detectedLanguage: { language: string; isConfident: boolean }[]; translatedText: string[]; alternatives: string[][] }`
  - `TranslateErrorResponse` type: `{ error: string }`
- [ ] `src/routes/translate/+server.ts` imports and uses these types
- [ ] `src/routes/+page.svelte` imports `TranslateResponse` instead of `TranslateResult`
- [ ] `pnpm check` passes
- [ ] `pnpm test:unit` passes

### US-308: Add lint and typecheck steps to CI
**Description:** As a developer, I want CI to catch lint and type errors so that broken code doesn't merge to master.

**Acceptance Criteria:**
- [ ] In `.github/workflows/test.yml`, add two steps to the `unit-tests` job after dependency install:
  - `pnpm lint` (runs prettier + eslint checks)
  - `pnpm check` (runs svelte-check + TypeScript)
- [ ] These steps run before `pnpm test:unit`
- [ ] Lint step uses `--max-warnings=0` flag (update the `lint` script in `package.json` to add `eslint . --max-warnings=0`)

### US-309: Add TOS disclaimer to README
**Description:** As a project maintainer, I want a disclaimer in the README about DeepL's Terms of Service so that users are informed of the legal implications.

**Acceptance Criteria:**
- [ ] Add a "⚠️ Disclaimer" section in `README.md` after the "Features" section
- [ ] Text states that DXTranslate uses DeepL's internal endpoint (not the official API), this may violate DeepL's Terms of Service, use at your own risk, and the endpoint may stop working at any time
- [ ] Keep it concise — 2-3 sentences max

## Functional Requirements (Phase 3)

- FR-301: All test mocks must match the production `TranslateResult` type shape exactly
- FR-302: `TranslateResult` must not contain unused optional fields
- FR-303: All Svelte event dispatchers must be typed with generics
- FR-304: Store subscriptions must be cleaned up in `onDestroy`
- FR-305: No commented-out code blocks in production modules
- FR-306: DeepL base URL must be configurable via `DEEPL_BASE_URL` env var
- FR-307: Client and server must share API type definitions from `src/lib/types/api.ts`
- FR-308: CI must run lint (zero warnings) and typecheck before tests
- FR-309: README must include a legal disclaimer about DeepL endpoint usage

## Non-Goals (Phase 3)

- No Svelte 5 migration
- No new features or UI changes
- No official DeepL API key support
- No database or persistence changes

---

# Design Considerations

- All changes must preserve the existing Pico CSS design language
- No new CSS frameworks or component libraries
- ThemeSwitch redesign (US-201) must visually match the current dropdown appearance
- Character counter (US-204) should be subtle and not distract from the main UI

# Technical Considerations

- **Deployment target:** Vercel (serverless). Rate limiting should leverage Vercel's platform features rather than in-memory solutions
- **Framework:** Svelte 4 with SvelteKit. No migration to Svelte 5 runes
- **Testing:** Vitest for unit tests, Playwright for E2E. All changes must pass existing tests
- **Dependencies:** No new runtime dependencies. Dev dependencies only if needed for testing

# Success Metrics

- **Phase 1:** Zero internal error details leaked in `/translate` 500 responses. All requests timeout after 10s max. Security headers present on all responses
- **Phase 2:** ThemeSwitch fully keyboard-navigable. Screen reader announces loading state. Character counter visible and accurate
- **Phase 3:** `pnpm check` and `pnpm lint` pass with zero warnings in CI. All test mocks match production types. Shared API types used across client and server

# Open Questions

- Should we add Vercel WAF rate limiting rules as part of Phase 1, or document it as a separate ops task?
- Should the character counter in US-204 enforce a hard limit (prevent typing beyond 10,000) or just show a warning?
- Should Phase 1 security headers include a Content-Security-Policy? (CSP can be complex to configure correctly with SvelteKit)
