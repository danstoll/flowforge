import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ForgeHookManifest } from '../types';

interface KongService {
  id: string;
  name: string;
  host: string;
  port: number;
  path?: string;
  protocol: string;
}

interface KongRoute {
  id: string;
  name: string;
  paths: string[];
  service: { id: string };
}

export class KongService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.kong.adminUrl;
    logger.info({ kongAdminUrl: this.baseUrl }, 'Kong service initialized');
  }

  // ==========================================================================
  // Health Check
  // ==========================================================================

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Service Management
  // ==========================================================================

  async createService(
    pluginId: string, 
    manifest: ForgeHookManifest, 
    hostPort: number
  ): Promise<KongService> {
    const serviceName = `forgehook-${manifest.id}`;
    
    // Check if service already exists
    try {
      const existing = await this.getService(serviceName);
      if (existing) {
        logger.info({ serviceName }, 'Kong service already exists, updating');
        return this.updateService(serviceName, manifest, hostPort);
      }
    } catch {
      // Service doesn't exist, create it
    }
    
    logger.info({ serviceName, hostPort }, 'Creating Kong service');
    
    const response = await axios.post(`${this.baseUrl}/services`, {
      name: serviceName,
      host: `forgehook-${manifest.id}`,  // Container name in Docker network
      port: manifest.port,
      protocol: 'http',
      path: '/',
      connect_timeout: 10000,
      read_timeout: 60000,
      write_timeout: 60000,
      retries: 3,
    });
    
    logger.info({ serviceName, serviceId: response.data.id }, 'Kong service created');
    return response.data;
  }

  async updateService(
    serviceName: string, 
    manifest: ForgeHookManifest, 
    hostPort: number
  ): Promise<KongService> {
    const response = await axios.patch(`${this.baseUrl}/services/${serviceName}`, {
      host: `forgehook-${manifest.id}`,
      port: manifest.port,
    });
    
    return response.data;
  }

  async getService(serviceName: string): Promise<KongService | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/services/${serviceName}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async deleteService(serviceName: string): Promise<void> {
    try {
      // First delete all routes
      await this.deleteServiceRoutes(serviceName);
      
      // Then delete the service
      await axios.delete(`${this.baseUrl}/services/${serviceName}`);
      logger.info({ serviceName }, 'Kong service deleted');
    } catch (error) {
      logger.warn({ serviceName, error }, 'Failed to delete Kong service');
    }
  }

  // ==========================================================================
  // Route Management
  // ==========================================================================

  async createRoute(
    serviceName: string, 
    manifest: ForgeHookManifest
  ): Promise<KongRoute> {
    const routeName = `forgehook-${manifest.id}-route`;
    const basePath = manifest.basePath || `/api/v1/${manifest.id}`;
    
    // Check if route already exists
    try {
      const existing = await this.getRoute(routeName);
      if (existing) {
        logger.info({ routeName }, 'Kong route already exists');
        return existing;
      }
    } catch {
      // Route doesn't exist, create it
    }
    
    logger.info({ routeName, basePath }, 'Creating Kong route');
    
    const response = await axios.post(`${this.baseUrl}/services/${serviceName}/routes`, {
      name: routeName,
      paths: [basePath],
      strip_path: true,
      preserve_host: false,
      protocols: ['http', 'https'],
    });
    
    logger.info({ routeName, routeId: response.data.id }, 'Kong route created');
    return response.data;
  }

  async getRoute(routeName: string): Promise<KongRoute | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/routes/${routeName}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async deleteServiceRoutes(serviceName: string): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/services/${serviceName}/routes`);
      const routes = response.data.data || [];
      
      for (const route of routes) {
        await axios.delete(`${this.baseUrl}/routes/${route.id}`);
        logger.info({ routeId: route.id }, 'Kong route deleted');
      }
    } catch (error) {
      logger.warn({ serviceName, error }, 'Failed to delete Kong routes');
    }
  }

  // ==========================================================================
  // Plugin Configuration (Rate Limiting, etc.)
  // ==========================================================================

  async addRateLimiting(
    serviceName: string, 
    requestsPerMinute: number = 100
  ): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/services/${serviceName}/plugins`, {
        name: 'rate-limiting',
        config: {
          minute: requestsPerMinute,
          policy: 'local',
        },
      });
      logger.info({ serviceName, requestsPerMinute }, 'Rate limiting added');
    } catch (error) {
      logger.warn({ serviceName, error }, 'Failed to add rate limiting');
    }
  }

  async addCors(serviceName: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/services/${serviceName}/plugins`, {
        name: 'cors',
        config: {
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          headers: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
          credentials: true,
          max_age: 3600,
        },
      });
      logger.info({ serviceName }, 'CORS plugin added');
    } catch (error) {
      logger.warn({ serviceName, error }, 'Failed to add CORS plugin');
    }
  }

  // ==========================================================================
  // Full Plugin Registration
  // ==========================================================================

  async registerPlugin(
    pluginId: string, 
    manifest: ForgeHookManifest, 
    hostPort: number
  ): Promise<void> {
    logger.info({ pluginId, forgehookId: manifest.id }, 'Registering plugin with Kong');
    
    try {
      // Create service
      await this.createService(pluginId, manifest, hostPort);
      
      // Create route
      const serviceName = `forgehook-${manifest.id}`;
      await this.createRoute(serviceName, manifest);
      
      // Add plugins
      await this.addRateLimiting(serviceName);
      await this.addCors(serviceName);
      
      logger.info({ pluginId, forgehookId: manifest.id }, 'Plugin registered with Kong');
    } catch (error) {
      logger.error({ pluginId, error }, 'Failed to register plugin with Kong');
      throw error;
    }
  }

  async unregisterPlugin(manifest: ForgeHookManifest): Promise<void> {
    const serviceName = `forgehook-${manifest.id}`;
    logger.info({ serviceName }, 'Unregistering plugin from Kong');
    
    await this.deleteService(serviceName);
  }
}

// Singleton instance
export const kongService = new KongService();
