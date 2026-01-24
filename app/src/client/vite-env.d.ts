/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API URL for Vite dev server proxy */
  readonly VITE_API_URL?: string;
  /** Browser-side API base URL (Kong gateway) - overrides auto-detection */
  readonly VITE_API_BASE_URL?: string;
  /** Override port for browser API calls (default: 8000) */
  readonly VITE_API_PORT?: string;
  /** @deprecated Use VITE_API_BASE_URL instead */
  readonly VITE_API_HOST?: string;
  /** @deprecated */
  readonly VITE_PLUGIN_MANAGER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
