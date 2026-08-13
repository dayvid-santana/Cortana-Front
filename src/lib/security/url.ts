/**
 * Central allowlist for link schemes we ever render as clickable. Anything
 * else (javascript:, data:, vbscript:, file:, ...) is treated as unsafe and
 * rendered as inert text instead of a link — see markdown-components.tsx and
 * safe-link.tsx, the two call sites that consume this.
 */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl, window.location.origin);
    return SAFE_SCHEMES.has(url.protocol);
  } catch {
    return false;
  }
}

/** Relative, in-app links (e.g. "#heading", "/projects/x") are always safe. */
export function isRelativeUrl(rawUrl: string): boolean {
  return (
    rawUrl.startsWith("/") ||
    rawUrl.startsWith("#") ||
    rawUrl.startsWith("./") ||
    rawUrl.startsWith("../")
  );
}

export function buildSearchUrl(
  pathname: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query.length > 0 ? `${pathname}?${query}` : pathname;
}
