import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface IntegrationAction {
  name: string;
  method: string;
  path: string;
  description: string;
}

export interface Integration {
  id: string;
  name: string;
  pluginId: string;
  pluginName: string;
  downloadUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  setupSteps?: string[];
  actions?: IntegrationAction[];
}

export interface PlatformConnector {
  id: string;
  name: string;
  format: string;
  description: string;
  status: 'ready' | 'in-development' | 'planned';
  connectors: Integration[];
}

export interface IntegrationsResponse {
  platforms: PlatformConnector[];
  totalConnectors: number;
}

async function fetchIntegrations(): Promise<IntegrationsResponse> {
  const response = await api.get<IntegrationsResponse>('/api/v1/integrations/platforms');
  return response.data;
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations', 'platforms'],
    queryFn: fetchIntegrations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
