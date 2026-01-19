// ForgeHook Manifest Types

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
  documentation?: string;
  icon?: string;
  category?: ForgeHookCategory;
  tags?: string[];
  
  image: {
    repository: string;
    tag?: string;
    digest?: string;
  };
  
  port: number;
  hostPort?: number;
  basePath?: string;
  
  healthCheck?: {
    path?: string;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
  
  endpoints: ForgeHookEndpoint[];
  
  config?: {
    schema?: Record<string, unknown>;
    defaults?: Record<string, unknown>;
  };
  
  environment?: ForgeHookEnvVar[];
  volumes?: ForgeHookVolume[];
  
  resources?: {
    memory?: string;
    cpu?: string;
    gpu?: boolean;
  };
  
  dependencies?: {
    forgehooks?: Array<{
      id: string;
      version?: string;
      optional?: boolean;
    }>;
    services?: Array<'redis' | 'postgres' | 'qdrant'>;
  };
  
  capabilities?: string[];
  
  hooks?: {
    onInstall?: string;
    onStart?: string;
    onStop?: string;
    onUninstall?: string;
  };
}

export type ForgeHookCategory = 
  | 'security' 
  | 'ai' 
  | 'data' 
  | 'media' 
  | 'integration' 
  | 'utility' 
  | 'analytics' 
  | 'communication';

export interface ForgeHookEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  requestBody?: Record<string, unknown>;
  authentication?: boolean;
  rateLimit?: {
    requests: number;
    period: 'second' | 'minute' | 'hour' | 'day';
  };
}

export interface ForgeHookEnvVar {
  name: string;
  description: string;
  required?: boolean;
  secret?: boolean;
  default?: string;
  validation?: string;
}

export interface ForgeHookVolume {
  name: string;
  containerPath: string;
  description?: string;
  readOnly?: boolean;
}

// Plugin Instance (installed plugin)
export type PluginStatus = 
  | 'installing' 
  | 'installed' 
  | 'starting' 
  | 'running' 
  | 'stopping' 
  | 'stopped' 
  | 'error' 
  | 'uninstalling';

export interface PluginInstance {
  id: string;
  forgehookId: string;
  manifest: ForgeHookManifest;
  status: PluginStatus;
  containerId?: string;
  containerName: string;
  hostPort: number;
  config: Record<string, unknown>;
  environment: Record<string, string>;
  installedAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  lastHealthCheck?: Date;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
  logs?: string[];
}

// Plugin Events
export type PluginEventType = 
  | 'plugin:installing'
  | 'plugin:installed'
  | 'plugin:starting'
  | 'plugin:started'
  | 'plugin:stopping'
  | 'plugin:stopped'
  | 'plugin:error'
  | 'plugin:health'
  | 'plugin:logs'
  | 'plugin:uninstalling'
  | 'plugin:uninstalled';

export interface PluginEvent {
  type: PluginEventType;
  pluginId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// API Types
export interface InstallPluginRequest {
  manifestUrl?: string;
  manifest?: ForgeHookManifest;
  config?: Record<string, unknown>;
  environment?: Record<string, string>;
  autoStart?: boolean;
}

export interface PluginResponse {
  id: string;
  forgehookId: string;
  name: string;
  version: string;
  status: PluginStatus;
  hostPort: number;
  healthStatus?: string;
  error?: string;
  endpoints?: ForgeHookEndpoint[];
}

export interface PluginListResponse {
  plugins: PluginResponse[];
  total: number;
}

// Registry Types (for plugin marketplace)
export interface RegistryPlugin {
  id: string;
  manifest: ForgeHookManifest;
  downloads: number;
  rating: number;
  verified: boolean;
  publishedAt: Date;
  updatedAt: Date;
}
