/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the auth service, no trailing slash. */
  readonly VITE_AUTH_URL: string;
  /** Base URL of the bag service (categories and items), no trailing slash. */
  readonly VITE_BAG_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
