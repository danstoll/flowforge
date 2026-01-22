// ForgeHook Types for Web UI

export type ForgeHookCategory = 
  | 'security' 
  | 'ai' 
  | 'data' 
  | 'media' 
  | 'integration' 
  | 'utility' 
  | 'analytics' 
  | 'communication';

export type PluginStatus = 
  | 'installing' 
  | 'installed' 
  | 'starting' 
  | 'running' 
  | 'stopping' 
  | 'stopped' 
  | 'error' 
  | 'uninstalling';

export interface ForgeHookEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  authentication?: boolean;
}

export interface ForgeHookManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: string;
  repository?: string;
  icon?: string;
  category?: ForgeHookCategory;
  tags?: string[];
  image: {
    repository: string;
    tag?: string;
  };
  port: number;
  basePath?: string;
  endpoints: ForgeHookEndpoint[];
  environment?: Array<{
    name: string;
    description: string;
    required?: boolean;
    secret?: boolean;
    default?: string;
  }>;
  resources?: {
    memory?: string;
    cpu?: string;
  };
  dependencies?: {
    services?: Array<'redis' | 'postgres' | 'qdrant'>;
  };
}

export interface InstalledPlugin {
  id: string;
  forgehookId: string;
  name: string;
  version: string;
  description?: string;
  status: PluginStatus;
  runtime?: 'container' | 'embedded';
  hostPort?: number;
  assignedPort?: number;
  containerId?: string;
  health?: {
    healthy: boolean;
    lastCheck?: string;
    message?: string;
    host?: string;
  };
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
  manifest: ForgeHookManifest;
  config?: Record<string, unknown>;
  environment?: Record<string, string>;
  installedAt: string;
  startedAt?: string;
  endpoints?: ForgeHookEndpoint[];
  installedVersion?: string;
  previousVersion?: string;
  bundleUrl?: string;
  lastUpdatedAt?: string;
}

export interface PluginListResponse {
  plugins: InstalledPlugin[];
  total: number;
}

// Registry plugins (available for install)
export interface RegistryPlugin {
  id: string;
  manifest: ForgeHookManifest;
  downloads?: number;
  rating?: number;
  verified?: boolean;
  featured?: boolean;
  repository?: string;
}

// Category metadata
export const CATEGORY_INFO: Record<ForgeHookCategory, { label: string; icon: string; color: string }> = {
  security: { label: 'Security', icon: 'shield', color: 'text-red-500' },
  ai: { label: 'AI & ML', icon: 'brain', color: 'text-purple-500' },
  data: { label: 'Data', icon: 'database', color: 'text-blue-500' },
  media: { label: 'Media', icon: 'image', color: 'text-green-500' },
  integration: { label: 'Integration', icon: 'plug', color: 'text-orange-500' },
  utility: { label: 'Utility', icon: 'wrench', color: 'text-gray-500' },
  analytics: { label: 'Analytics', icon: 'bar-chart', color: 'text-cyan-500' },
  communication: { label: 'Communication', icon: 'mail', color: 'text-pink-500' },
};
