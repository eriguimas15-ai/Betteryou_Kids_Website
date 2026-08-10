/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL completa da API incluindo `/api` (ex.: https://api.betteryoukids.com/api) */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
