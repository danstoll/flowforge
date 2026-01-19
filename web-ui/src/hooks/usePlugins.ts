import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  InstalledPlugin, 
  PluginListResponse, 
  ForgeHookManifest,
  BUILTIN_FORGEHOOKS,
  RegistryPlugin,
} from '../types/forgehook';

// Use environment variable for API host
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const PLUGIN_MANAGER_URL = `http://${API_HOST}:4000`;

// =============================================================================
// API Functions
// =============================================================================

async function fetchInstalledPlugins(): Promise<PluginListResponse> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins`);
  if (!response.ok) {
    throw new Error('Failed to fetch plugins');
  }
  return response.json();
}

async function fetchPluginDetails(pluginId: string): Promise<InstalledPlugin> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch plugin details');
  }
  return response.json();
}

async function installPlugin(request: {
  manifest: ForgeHookManifest;
  config?: Record<string, unknown>;
  environment?: Record<string, string>;
  autoStart?: boolean;
}): Promise<InstalledPlugin> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/install`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to install plugin');
  }
  return response.json();
}

async function startPlugin(pluginId: string): Promise<void> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}/start`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to start plugin');
  }
}

async function stopPlugin(pluginId: string): Promise<void> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to stop plugin');
  }
}

async function restartPlugin(pluginId: string): Promise<void> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}/restart`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to restart plugin');
  }
}

async function uninstallPlugin(pluginId: string): Promise<void> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to uninstall plugin');
  }
}

async function fetchPluginLogs(pluginId: string, tail: number = 100): Promise<string[]> {
  const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/plugins/${pluginId}/logs?tail=${tail}`);
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  const data = await response.json();
  return data.logs;
}

// =============================================================================
// React Query Hooks
// =============================================================================

export function useInstalledPlugins() {
  return useQuery({
    queryKey: ['plugins', 'installed'],
    queryFn: fetchInstalledPlugins,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: false,
  });
}

export function usePluginDetails(pluginId: string | undefined) {
  return useQuery({
    queryKey: ['plugins', 'details', pluginId],
    queryFn: () => fetchPluginDetails(pluginId!),
    enabled: !!pluginId,
    refetchInterval: 5000,
  });
}

export function usePluginLogs(pluginId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['plugins', 'logs', pluginId],
    queryFn: () => fetchPluginLogs(pluginId!, 100),
    enabled: !!pluginId && enabled,
    refetchInterval: 5000,
  });
}

export function useInstallPlugin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: installPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}

export function useStartPlugin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: startPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}

export function useStopPlugin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: stopPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}

export function useRestartPlugin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: restartPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uninstallPlugin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}

// =============================================================================
// Registry (Fetched from plugin-manager registry API)
// =============================================================================

export function useAvailablePlugins() {
  return useQuery({
    queryKey: ['plugins', 'registry'],
    queryFn: async (): Promise<RegistryPlugin[]> => {
      const response = await fetch(`${PLUGIN_MANAGER_URL}/api/v1/registry/plugins`);
      if (!response.ok) {
        // Fallback to built-in plugins if registry API fails
        console.warn('Failed to fetch registry, falling back to built-in plugins');
        return BUILTIN_FORGEHOOKS;
      }
      const data = await response.json();
      return data.plugins;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// =============================================================================
// WebSocket Hook for Real-time Events
// =============================================================================

export function usePluginEvents(onEvent: (event: unknown) => void) {
  const queryClient = useQueryClient();
  
  // Connect to WebSocket
  const ws = new WebSocket(`ws://${API_HOST}:4000/ws/events`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onEvent(data);
    
    // Invalidate queries on relevant events
    if (data.type?.startsWith('plugin:')) {
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    }
  };
  
  return () => {
    ws.close();
  };
}
