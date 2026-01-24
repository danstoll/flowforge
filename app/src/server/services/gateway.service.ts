/**
 * Gateway Service
 * 
 * Manages gateway plugins that proxy requests to external services
 * running on the host or elsewhere (Foundry Local, Ollama, LM Studio, etc.)
 */

import { logger } from '../utils/logger.js';
import { databaseService } from './database.service.js';
import { 
  ForgeHookManifest, 
  PluginInstance
} from '../types/index.js';

interface GatewayHealth {
  healthy: boolean;
  latency?: number;
  error?: string;
  lastCheck: Date;
}

interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  latency: number;
}

// Discovery configurations for known services
const DISCOVERY_CONFIGS: Record<string, { defaultPort: number; healthPath: string }> = {
  'foundry-local': { defaultPort: 5272, healthPath: '/health' },
  'ollama': { defaultPort: 11434, healthPath: '/api/tags' },
  'lm-studio': { defaultPort: 1234, healthPath: '/v1/models' },
  'manual': { defaultPort: 8080, healthPath: '/health' },
};

class GatewayService {
  private healthCache: Map<string, GatewayHealth> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    logger.info('Gateway service initialized');
  }

  /**
   * Resolve environment variables in a string
   * Supports ${VAR} and ${VAR:-default} syntax
   */
  private resolveEnvVars(value: string, environment: Record<string, string> = {}): string {
    return value.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      const [varName, defaultValue] = expr.split(':-');
      return environment[varName] || process.env[varName] || defaultValue || match;
    });
  }

  /**
   * Get the resolved base URL for a gateway plugin
   */
  getResolvedUrl(manifest: ForgeHookManifest, environment: Record<string, string> = {}): string {
    if (!manifest.gateway?.baseUrl) {
      throw new Error('Gateway plugin requires gateway.baseUrl');
    }

    let baseUrl = this.resolveEnvVars(manifest.gateway.baseUrl, environment);

    // Handle discovery
    if (manifest.gateway.discovery && manifest.gateway.discovery !== 'manual') {
      const config = DISCOVERY_CONFIGS[manifest.gateway.discovery];
      if (config && !baseUrl.includes(':')) {
        // If no port specified, use default for discovery type
        baseUrl = baseUrl.replace(/\/?$/, `:${config.defaultPort}`);
      }
    }

    // Ensure no trailing slash
    return baseUrl.replace(/\/$/, '');
  }

  /**
   * Install a gateway plugin
   */
  async installPlugin(options: {
    manifest: ForgeHookManifest;
    config?: Record<string, unknown>;
    environment?: Record<string, string>;
  }): Promise<PluginInstance> {
    const { manifest, config = {}, environment = {} } = options;

    if (manifest.runtime !== 'gateway') {
      throw new Error('Not a gateway plugin');
    }

    if (!manifest.gateway?.baseUrl) {
      throw new Error('Gateway plugin requires gateway.baseUrl configuration');
    }

    logger.info({ pluginId: manifest.id, name: manifest.name }, 'Installing gateway plugin');

    // Resolve the gateway URL
    const gatewayUrl = this.getResolvedUrl(manifest, environment);
    const healthPath = manifest.gateway.healthCheck || 
      DISCOVERY_CONFIGS[manifest.gateway.discovery || 'manual']?.healthPath || 
      '/health';

    // Check if the external service is reachable
    const healthCheck = await this.checkHealth(gatewayUrl, healthPath, manifest.gateway.timeout);

    const plugin: PluginInstance = {
      id: crypto.randomUUID(),
      forgehookId: manifest.id,
      manifest,
      status: healthCheck.healthy ? 'running' : 'stopped',
      runtime: 'gateway',
      config,
      environment,
      gatewayUrl,
      gatewayHealthPath: healthPath,
      healthStatus: healthCheck.healthy ? 'healthy' : 'unhealthy',
      error: healthCheck.error,
      installedAt: new Date(),
      startedAt: healthCheck.healthy ? new Date() : undefined,
      lastHealthCheck: new Date(),
      installedVersion: manifest.version,
    };

    // Save to database
    await databaseService.createPlugin(plugin);

    logger.info({ 
      pluginId: plugin.id, 
      gatewayUrl, 
      healthy: healthCheck.healthy 
    }, 'Gateway plugin installed');

    return plugin;
  }

  /**
   * Check health of an external service
   */
  async checkHealth(
    baseUrl: string, 
    healthPath: string = '/health',
    timeout: number = 5000
  ): Promise<GatewayHealth> {
    const url = `${baseUrl}${healthPath}`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const health: GatewayHealth = {
        healthy: response.ok,
        latency,
        lastCheck: new Date(),
      };

      if (!response.ok) {
        health.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      return health;
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Check health of a gateway plugin
   */
  async checkPluginHealth(pluginId: string): Promise<GatewayHealth> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      return {
        healthy: false,
        error: 'Plugin not found or not a gateway plugin',
        lastCheck: new Date(),
      };
    }

    const health = await this.checkHealth(
      plugin.gatewayUrl!,
      plugin.gatewayHealthPath,
      plugin.manifest.gateway?.timeout
    );

    // Update plugin health status
    plugin.healthStatus = health.healthy ? 'healthy' : 'unhealthy';
    plugin.lastHealthCheck = health.lastCheck;
    plugin.status = health.healthy ? 'running' : 'error';
    plugin.error = health.error;

    await databaseService.updatePlugin(pluginId, {
      healthStatus: plugin.healthStatus,
      lastHealthCheck: plugin.lastHealthCheck,
      status: plugin.status,
      error: plugin.error,
    });

    // Cache the health result
    this.healthCache.set(pluginId, health);

    return health;
  }

  /**
   * Proxy a request to the gateway service
   */
  async proxyRequest(
    pluginId: string, 
    request: ProxyRequest
  ): Promise<ProxyResponse> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      throw new Error('Plugin not found or not a gateway plugin');
    }

    if (!plugin.gatewayUrl) {
      throw new Error('Gateway URL not configured');
    }

    const gatewayConfig = plugin.manifest.gateway!;
    const startTime = Date.now();

    // Build the target URL
    let targetPath = request.path;
    if (gatewayConfig.stripPrefix !== false) {
      // Remove the plugin prefix from the path (e.g., /foundry-local/chat -> /chat)
      targetPath = request.path.replace(new RegExp(`^/${plugin.forgehookId}`), '');
    }
    const targetUrl = `${plugin.gatewayUrl}${targetPath}`;

    // Merge headers
    const headers: Record<string, string> = {
      ...gatewayConfig.headers,
      ...request.headers,
    };

    // Remove host header to avoid conflicts
    delete headers['host'];
    delete headers['Host'];

    const timeout = request.timeout || gatewayConfig.timeout || 30000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: controller.signal,
      };

      // Add body for non-GET requests
      if (request.body && request.method !== 'GET') {
        fetchOptions.body = JSON.stringify(request.body);
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }

      logger.debug({ 
        pluginId, 
        targetUrl, 
        method: request.method 
      }, 'Proxying gateway request');

      const response = await fetch(targetUrl, fetchOptions);
      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      // Parse response
      const contentType = response.headers.get('content-type') || '';
      let body: unknown;

      if (contentType.includes('application/json')) {
        body = await response.json();
      } else if (contentType.includes('text/')) {
        body = await response.text();
      } else {
        // Return as buffer for binary content
        const buffer = await response.arrayBuffer();
        body = Buffer.from(buffer).toString('base64');
      }

      // Convert headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        headers: responseHeaders,
        body,
        latency,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Gateway request timed out after ${timeout}ms`);
      }

      throw new Error(
        `Gateway proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Start a gateway plugin (verify connectivity)
   */
  async startPlugin(pluginId: string): Promise<PluginInstance> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      throw new Error('Plugin not found or not a gateway plugin');
    }

    // Check if external service is available
    const health = await this.checkPluginHealth(pluginId);

    if (!health.healthy) {
      plugin.status = 'error';
      plugin.error = health.error || 'External service unavailable';
    } else {
      plugin.status = 'running';
      plugin.startedAt = new Date();
      plugin.error = undefined;
    }

    await databaseService.updatePlugin(pluginId, {
      status: plugin.status,
      startedAt: plugin.startedAt,
      error: plugin.error,
    });

    return plugin;
  }

  /**
   * Stop a gateway plugin (just marks as stopped)
   */
  async stopPlugin(pluginId: string): Promise<PluginInstance> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      throw new Error('Plugin not found or not a gateway plugin');
    }

    plugin.status = 'stopped';
    plugin.stoppedAt = new Date();

    await databaseService.updatePlugin(pluginId, {
      status: plugin.status,
      stoppedAt: plugin.stoppedAt,
    });

    return plugin;
  }

  /**
   * Uninstall a gateway plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      throw new Error('Plugin not found or not a gateway plugin');
    }

    // Remove from health cache
    this.healthCache.delete(pluginId);

    // Delete from database
    await databaseService.deletePlugin(pluginId);

    logger.info({ pluginId }, 'Gateway plugin uninstalled');
  }

  /**
   * Get logs for a gateway plugin (returns health check history)
   */
  async getPluginLogs(pluginId: string): Promise<string[]> {
    const plugin = await databaseService.getPlugin(pluginId);
    
    if (!plugin || plugin.runtime !== 'gateway') {
      throw new Error('Plugin not found or not a gateway plugin');
    }

    const health = this.healthCache.get(pluginId);
    const logs: string[] = [
      `[${new Date().toISOString()}] Gateway plugin: ${plugin.manifest.name}`,
      `[${new Date().toISOString()}] Target URL: ${plugin.gatewayUrl}`,
      `[${new Date().toISOString()}] Status: ${plugin.status}`,
      `[${new Date().toISOString()}] Health: ${plugin.healthStatus || 'unknown'}`,
    ];

    if (health) {
      logs.push(`[${health.lastCheck.toISOString()}] Last health check: ${health.healthy ? 'passed' : 'failed'}`);
      if (health.latency) {
        logs.push(`[${health.lastCheck.toISOString()}] Latency: ${health.latency}ms`);
      }
      if (health.error) {
        logs.push(`[${health.lastCheck.toISOString()}] Error: ${health.error}`);
      }
    }

    logs.push(`[${new Date().toISOString()}] Note: Gateway plugins proxy to external services`);

    return logs;
  }

  /**
   * Start periodic health checks for all gateway plugins
   */
  startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const plugins = await databaseService.listPlugins();
      const gatewayPlugins = plugins.filter(p => p.runtime === 'gateway' && p.status !== 'stopped');

      for (const plugin of gatewayPlugins) {
        try {
          await this.checkPluginHealth(plugin.id);
        } catch (error) {
          logger.error({ pluginId: plugin.id, error }, 'Gateway health check failed');
        }
      }
    }, intervalMs);

    logger.info({ intervalMs }, 'Gateway health checks started');
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Discover available services on common ports
   */
  async discoverServices(): Promise<Array<{ type: string; url: string; healthy: boolean }>> {
    const discovered: Array<{ type: string; url: string; healthy: boolean }> = [];

    for (const [type, config] of Object.entries(DISCOVERY_CONFIGS)) {
      if (type === 'manual') continue;

      const url = `http://localhost:${config.defaultPort}`;
      const health = await this.checkHealth(url, config.healthPath, 2000);

      if (health.healthy) {
        discovered.push({ type, url, healthy: true });
        logger.info({ type, url }, 'Discovered external service');
      }
    }

    return discovered;
  }
}

export const gatewayService = new GatewayService();
