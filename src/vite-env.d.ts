/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEVMATE_API_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_BUILD_SHA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
