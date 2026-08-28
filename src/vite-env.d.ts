/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVMATE_API_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_BUILD_SHA: string;
  /** Dev-only override for the local Cortana agent API. Ignored in production builds. */
  readonly VITE_CORTANA_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
