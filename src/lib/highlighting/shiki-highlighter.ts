import { getSingletonHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemedToken } from "shiki";

export type HighlightThemeMode = "light" | "dark";

/**
 * Fine-grained per-language loaders, kept to exactly the languages DevMate
 * renders. Using shiki/core + explicit imports (instead of the top-level
 * `shiki` package's `bundledLanguages`) keeps every other language out of
 * Rollup's reachable graph entirely, rather than merely out of the initial
 * chunk — see docs/web-api-gaps.md for why this matters here.
 */
const LANG_LOADERS = {
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
} as const;

type SupportedLang = keyof typeof LANG_LOADERS;

const THEME_LOADERS = {
  "github-light": () => import("shiki/themes/github-light.mjs"),
  "github-dark": () => import("shiki/themes/github-dark.mjs"),
} as const;

function toSupportedLang(language: string): SupportedLang | null {
  return language in LANG_LOADERS ? (language as SupportedLang) : null;
}

export async function highlightLines(
  code: string,
  language: string,
  themeMode: HighlightThemeMode,
): Promise<ThemedToken[][] | null> {
  const lang = toSupportedLang(language);
  if (!lang) {
    return null;
  }

  const theme = themeMode === "dark" ? "github-dark" : "github-light";
  const highlighter = await getSingletonHighlighterCore({
    langs: [LANG_LOADERS[lang]],
    themes: [THEME_LOADERS[theme]],
    engine: createJavaScriptRegexEngine(),
  });

  return highlighter.codeToTokens(code, { lang, theme }).tokens;
}
