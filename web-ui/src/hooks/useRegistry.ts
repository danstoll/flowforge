import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RegistryPlugin, ForgeHookCategory } from '@/types/forgehook';

const PLUGIN_MANAGER_URL = import.meta.env.VITE_PLUGIN_MANAGER_URL || 'http://localhost:4000';

// ============================================================================
// API Functions
// ============================================================================

async function fetchAvailablePlugins(filters?: {
  category?: ForgeHookCategory;
  verified?: boolean;
  featured?: boolean;
  search?: string;
}): Promise<RegistryPlugin[]> {
  const params = new URLSearchParams();

  if (filters?.category) params.append('category', filters.category);
  if (filters?.verified !== undefined) params.append('verified', String(filters.verified));
  if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
  if (filters?.search) params.append('search', filters.search);

  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/plugins?${params.toString()}`
  );

  return response.data.plugins;
}

async function fetchPluginDetails(pluginId: string): Promise<RegistryPlugin> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/plugins/${pluginId}`
  );

  return response.data;
}

async function searchPlugins(query: string): Promise<RegistryPlugin[]> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/search?q=${encodeURIComponent(query)}`
  );

  return response.data.plugins;
}

async function fetchFeaturedPlugins(): Promise<RegistryPlugin[]> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/featured`
  );

  return response.data.plugins;
}

async function fetchPopularPlugins(): Promise<RegistryPlugin[]> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/popular`
  );

  return response.data.plugins;
}

async function fetchCategories(): Promise<Array<{ category: ForgeHookCategory; count: number }>> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/categories`
  );

  return response.data.categories;
}

async function fetchRegistryStats(): Promise<{
  totalPlugins: number;
  verifiedPlugins: number;
  featuredPlugins: number;
  categories: number;
  averageRating: number;
  totalDownloads: number;
}> {
  const response = await axios.get(
    `${PLUGIN_MANAGER_URL}/api/v1/registry/stats`
  );

  return response.data;
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Fetch available plugins from registry
 */
export function useAvailablePlugins(filters?: {
  category?: ForgeHookCategory;
  verified?: boolean;
  featured?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['registry', 'plugins', filters],
    queryFn: () => fetchAvailablePlugins(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single plugin details
 */
export function usePluginDetails(pluginId: string) {
  return useQuery({
    queryKey: ['registry', 'plugin', pluginId],
    queryFn: () => fetchPluginDetails(pluginId),
    enabled: !!pluginId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Search plugins
 */
export function useSearchPlugins(query: string) {
  return useQuery({
    queryKey: ['registry', 'search', query],
    queryFn: () => searchPlugins(query),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch featured plugins
 */
export function useFeaturedPlugins() {
  return useQuery({
    queryKey: ['registry', 'featured'],
    queryFn: fetchFeaturedPlugins,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch popular plugins
 */
export function usePopularPlugins() {
  return useQuery({
    queryKey: ['registry', 'popular'],
    queryFn: fetchPopularPlugins,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch all categories with counts
 */
export function useCategories() {
  return useQuery({
    queryKey: ['registry', 'categories'],
    queryFn: fetchCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Fetch registry statistics
 */
export function useRegistryStats() {
  return useQuery({
    queryKey: ['registry', 'stats'],
    queryFn: fetchRegistryStats,
    staleTime: 10 * 60 * 1000,
  });
}
