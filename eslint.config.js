import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "playwright-report",
    "test-results",
    "src/routeTree.gen.ts",
    "src/lib/api/schema.d.ts",
    "public/mockServiceWorker.js",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      // This project does not build with the React Compiler; the rule only
      // flags library APIs (e.g. TanStack Virtual/Router) that would defeat
      // compiler memoization if it were ever enabled, which isn't a bug here.
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    files: ["**/*.config.{ts,js,mjs}", "src/test/**", "tests/**", "src/mocks/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // TanStack Router file-based routes always export a `Route` object
    // alongside the route component; that's the framework's convention; it
    // is not a Fast Refresh boundary violation.
    files: ["src/routes/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Headless UI wrapper files intentionally re-export non-component
    // primitives (Root/Trigger/variants) alongside the styled component.
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
