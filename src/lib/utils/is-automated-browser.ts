/**
 * True when the page is driven by browser automation (Playwright, Selenium,
 * etc. all set `navigator.webdriver`). Used to skip mounting dev-only
 * floating UI (router/query devtools) that would otherwise overlap and
 * intercept pointer events during E2E tests — and in a real user's session,
 * that same floating UI has no business rendering under automation anyway.
 */
export function isAutomatedBrowser(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}
