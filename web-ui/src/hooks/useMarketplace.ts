import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Use environment variable for API host
const API_HOST = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_HOST || 'localhost';
const PLUGIN_MANAGER_URL = `http://${API_HOST}:4000`;

// =============================================================================
// Types
// =============================================================================

export interface RegistrySource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: number;
  isDefault: boolean;
  lastSync: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    url?: string;
  };
  license: string;
  icon?: string;
  category: string;
  tags: string[];
  image: {
    repository: string;
    tag: string;
  };
  port: number;
  basePath: string;
  endpoints: Array<{
    method: string;
    path: string;
    description: string;
    authentication?: boolean;
  }>;
  environment?: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  resources?: {
    memory?: string;
    cpu?: string;
  };
  healthCheck?: {
    path: string;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
  dependencies?: {
    services?: string[];
    plugins?: string[];
  };
  source?: string;
  sourceId?: string;
  verified?: boolean;
  featured?: boolean;
  downloads?: number;
  rating?: number;
}

export interface PackageInspectResult {
  manifest: MarketplacePlugin;
  files: string[];
  checksums: Record<string, string>;
  hasImage: boolean;
  isAlreadyInstalled: boolean;
}

export interface GitHubInstallRequest {
  url: string;
  config?: Record<string, unknown>;
  environment?: Record<string, string>;
  autoStart?: boolean;
}

// =============================================================================
// API Functions
// =============================================================================

// Marketplace (aggregated from all sources)
async function fetchMarketplace(): Promise<MarketplacePlugin[]> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace`);
  if (!response.ok) {
    throw new Error('Failed to fetch marketplace');
  }
  const data = await response.json();
  return data.plugins;
}

// Registry Sources
async function fetchSources(): Promise<RegistrySource[]> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources`);
  if (!response.ok) {
    throw new Error('Failed to fetch sources');
  }
  const data = await response.json();
  return data.sources;
}

async function createSource(source: { name: string; url: string; priority?: number }): Promise<RegistrySource> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create source');
  }
  return response.json();
}

async function updateSource(id: string, updates: Partial<RegistrySource>): Promise<RegistrySource> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update source');
  }
  return response.json();
}

async function deleteSource(id: string): Promise<void> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete source');
  }
}

async function toggleSource(id: string): Promise<RegistrySource> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources/${id}/toggle`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to toggle source');
  }
  return response.json();
}

async function refreshSource(id: string): Promise<{ message: string; pluginCount: number }> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/sources/${id}/refresh`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to refresh source');
  }
  return response.json();
}

// GitHub Installation
async function installFromGitHub(request: GitHubInstallRequest): Promise<{ plugin: MarketplacePlugin; containerId: string }> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/install/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to install from GitHub');
  }
  return response.json();
}

async function fetchGitHubManifest(url: string): Promise<MarketplacePlugin> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/marketplace/install/github/preview?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch manifest');
  }
  const data = await response.json();
  return data.manifest;
}

// Package Export/Import
async function exportPackage(pluginId: string): Promise<Blob> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}/export`);
  if (!response.ok) {
    throw new Error('Failed to export package');
  }
  return response.blob();
}

async function inspectPackage(file: File): Promise<PackageInspectResult> {
  const formData = new FormData();
  formData.append('package', file);
  
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/packages/inspect`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to inspect package');
  }
  return response.json();
}

async function importPackage(file: File, options?: { autoStart?: boolean }): Promise<{ plugin: MarketplacePlugin; containerId: string }> {
  const formData = new FormData();
  formData.append('package', file);
  if (options?.autoStart !== undefined) {
    formData.append('autoStart', String(options.autoStart));
  }
  
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/packages/import`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to import package');
  }
  return response.json();
}

// =============================================================================
// React Query Hooks
// =============================================================================

/**
 * Fetch aggregated marketplace plugins from all enabled sources
 */
export function useMarketplace() {
  return useQuery({
    queryKey: ['marketplace', 'plugins'],
    queryFn: fetchMarketplace,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Fetch all registry sources
 */
export function useRegistrySources() {
  return useQuery({
    queryKey: ['marketplace', 'sources'],
    queryFn: fetchSources,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Create a new registry source
 */
export function useCreateSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Update an existing registry source
 */
export function useUpdateSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RegistrySource> }) => 
      updateSource(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Delete a registry source
 */
export function useDeleteSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Toggle a registry source enabled/disabled
 */
export function useToggleSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Refresh a registry source cache
 */
export function useRefreshSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: refreshSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Install a ForgeHook from GitHub URL
 */
export function useInstallFromGitHub() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: installFromGitHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

/**
 * Preview a ForgeHook manifest from GitHub URL
 */
export function useGitHubManifest(url: string) {
  return useQuery({
    queryKey: ['marketplace', 'github', 'preview', url],
    queryFn: () => fetchGitHubManifest(url),
    enabled: !!url && url.includes('github.com'),
    staleTime: 60 * 1000, // 1 minute
    retry: false,
  });
}

/**
 * Export a plugin as .fhk package
 */
export function useExportPackage() {
  return useMutation({
    mutationFn: async ({ pluginId, filename }: { pluginId: string; filename: string }) => {
      const blob = await exportPackage(pluginId);
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { size: blob.size };
    },
  });
}

/**
 * Inspect a .fhk package without installing
 */
export function useInspectPackage() {
  return useMutation({
    mutationFn: inspectPackage,
  });
}

/**
 * Import and install a .fhk package
 */
export function useImportPackage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, autoStart }: { file: File; autoStart?: boolean }) => 
      importPackage(file, { autoStart }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}
