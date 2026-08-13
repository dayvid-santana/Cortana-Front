/**
 * Thin, failure-safe wrapper around localStorage. UI preferences only —
 * never store project content, messages, tokens, or credentials here (see
 * stores/ui-preferences-store.ts for what is allowed through this).
 */
export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private browsing, quota) — UI prefs are
    // non-critical, so we silently drop the write.
  }
}
