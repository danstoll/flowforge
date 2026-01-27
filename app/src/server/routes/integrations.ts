import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { integrationsService, UpdateIntegrationRequest, CreateIntegrationRequest } from '../services/integrations.service.js';
import { logger } from '../utils/logger.js';

interface IntegrationParams {
  integrationId: string;
}

// Platform connector types for the connectors catalog
interface ConnectorAction {
  name: string;
  method: string;
  path: string;
  description: string;
}

interface PlatformConnector {
  id: string;
  name: string;
  pluginId: string;
  pluginName: string;
  downloadUrl?: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  setupSteps?: string[];
  actions?: ConnectorAction[];
}

interface Platform {
  id: string;
  name: string;
  format: string;
  description: string;
  status: 'ready' | 'in-development' | 'planned';
  connectors: PlatformConnector[];
}

// Static platform connectors catalog
const PLATFORM_CONNECTORS: Platform[] = [
  {
    id: 'power-automate',
    name: 'Power Automate',
    format: 'OpenAPI Custom Connector',
    description: 'Connect FlowForge services to Microsoft Power Automate flows for enterprise automation.',
    status: 'in-development',
    connectors: [
      {
        id: 'pa-llm-service',
        name: 'LLM Service Connector',
        pluginId: 'llm-service',
        pluginName: 'LLM Service',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/power-automate/LlmService',
        setupSteps: [
          'Download the connector package',
          'Go to Power Automate > Data > Custom Connectors',
          'Click "New custom connector" > "Import an OpenAPI file"',
          'Upload the connector file and configure security',
          'Create a connection with your FlowForge API key',
        ],
        actions: [
          { name: 'Chat Completion', method: 'POST', path: '/chat', description: 'Generate AI chat responses' },
          { name: 'Text Generation', method: 'POST', path: '/generate', description: 'Generate text from a prompt' },
          { name: 'Create Embeddings', method: 'POST', path: '/embeddings', description: 'Generate vector embeddings' },
        ],
      },
      {
        id: 'pa-formula-engine',
        name: 'Formula Engine Connector',
        pluginId: 'formula-engine',
        pluginName: 'Formula Engine',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/power-automate/FormulaEngine',
        actions: [
          { name: 'Evaluate Formula', method: 'POST', path: '/evaluate', description: 'Evaluate an Excel-style formula' },
          { name: 'VLOOKUP', method: 'POST', path: '/vlookup', description: 'Perform a VLOOKUP operation' },
          { name: 'SUMIF', method: 'POST', path: '/sumif', description: 'Sum values matching criteria' },
        ],
      },
      {
        id: 'pa-crypto-service',
        name: 'Crypto Service Connector',
        pluginId: 'crypto-service',
        pluginName: 'Crypto Service',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/power-automate/CryptoService',
        actions: [
          { name: 'Encrypt', method: 'POST', path: '/encrypt', description: 'Encrypt data with AES-256' },
          { name: 'Decrypt', method: 'POST', path: '/decrypt', description: 'Decrypt AES-256 encrypted data' },
          { name: 'Hash', method: 'POST', path: '/hash', description: 'Generate cryptographic hash' },
          { name: 'Sign JWT', method: 'POST', path: '/jwt/sign', description: 'Create a signed JWT token' },
        ],
      },
      {
        id: 'pa-streaming-file',
        name: 'File Service Connector',
        pluginId: 'streaming-file-service',
        pluginName: 'Streaming File Service',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/power-automate/StreamingFileService',
        actions: [
          { name: 'Upload File', method: 'POST', path: '/upload', description: 'Upload a file with chunked transfer' },
          { name: 'Download File', method: 'GET', path: '/download', description: 'Download a file' },
          { name: 'Convert File', method: 'POST', path: '/convert', description: 'Convert file format' },
        ],
      },
    ],
  },
  {
    id: 'nintex-cloud',
    name: 'Nintex Workflow Cloud',
    format: 'OpenAPI Xtension',
    description: 'Extend Nintex Workflow Cloud with FlowForge AI and data processing capabilities.',
    status: 'ready',
    connectors: [
      {
        id: 'nwc-llm-service',
        name: 'LLM Service Xtension',
        pluginId: 'llm-service',
        pluginName: 'LLM Service',
        downloadUrl: 'https://raw.githubusercontent.com/danstoll/forgehooks-registry/master/integrations/nintex-cloud/LlmService/xtension.json',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/nintex-cloud/LlmService',
        setupSteps: [
          'Download the Xtension JSON file',
          'Go to Nintex Workflow Cloud > Xtensions',
          'Click "Add custom connector" and upload the file',
          'Configure the connector with your FlowForge URL and API key',
          'The actions will appear in the workflow designer',
        ],
        actions: [
          { name: 'AI Chat', method: 'POST', path: '/chat', description: 'Generate AI chat responses' },
          { name: 'Generate Text', method: 'POST', path: '/generate', description: 'Generate text content' },
          { name: 'Analyze Sentiment', method: 'POST', path: '/analyze', description: 'Analyze text sentiment' },
        ],
      },
      {
        id: 'nwc-formula-engine',
        name: 'Formula Engine Xtension',
        pluginId: 'formula-engine',
        pluginName: 'Formula Engine',
        downloadUrl: 'https://raw.githubusercontent.com/danstoll/forgehooks-registry/master/integrations/nintex-cloud/FormulaEngine/xtension.json',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/nintex-cloud/FormulaEngine',
        actions: [
          { name: 'Evaluate Formula', method: 'POST', path: '/evaluate', description: 'Run Excel-style formulas' },
          { name: 'Data Lookup', method: 'POST', path: '/lookup', description: 'Perform data lookups' },
        ],
      },
      {
        id: 'nwc-crypto-service',
        name: 'Crypto Service Xtension',
        pluginId: 'crypto-service',
        pluginName: 'Crypto Service',
        downloadUrl: 'https://raw.githubusercontent.com/danstoll/forgehooks-registry/master/integrations/nintex-cloud/CryptoService/xtension.json',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/nintex-cloud/CryptoService',
        actions: [
          { name: 'Encrypt Data', method: 'POST', path: '/encrypt', description: 'Encrypt sensitive data' },
          { name: 'Decrypt Data', method: 'POST', path: '/decrypt', description: 'Decrypt encrypted data' },
          { name: 'Generate Hash', method: 'POST', path: '/hash', description: 'Create secure hashes' },
        ],
      },
      {
        id: 'nwc-streaming-file',
        name: 'File Service Xtension',
        pluginId: 'streaming-file-service',
        pluginName: 'Streaming File Service',
        downloadUrl: 'https://raw.githubusercontent.com/danstoll/forgehooks-registry/master/integrations/nintex-cloud/StreamingFileService/xtension.json',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/nintex-cloud/StreamingFileService',
        actions: [
          { name: 'Process File', method: 'POST', path: '/process', description: 'Process and transform files' },
          { name: 'Extract Text', method: 'POST', path: '/extract', description: 'Extract text from documents' },
        ],
      },
      {
        id: 'nwc-gateway',
        name: 'Gateway Xtension',
        pluginId: 'gateway',
        pluginName: 'FlowForge Gateway',
        downloadUrl: 'https://raw.githubusercontent.com/danstoll/forgehooks-registry/master/integrations/nintex-cloud/Gateway/xtension.json',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/nintex-cloud/Gateway',
        actions: [
          { name: 'List Services', method: 'GET', path: '/services', description: 'Get available FlowForge services' },
          { name: 'Health Check', method: 'GET', path: '/health', description: 'Check FlowForge status' },
        ],
      },
    ],
  },
  {
    id: 'nintex-k2',
    name: 'Nintex K2',
    format: 'Swagger + SmartObjects',
    description: 'Integrate FlowForge services into K2 SmartForms and workflows.',
    status: 'in-development',
    connectors: [],
  },
  {
    id: 'n8n',
    name: 'n8n',
    format: 'TypeScript npm package',
    description: 'Use FlowForge nodes in your n8n self-hosted automation workflows.',
    status: 'in-development',
    connectors: [
      {
        id: 'n8n-flowforge',
        name: 'FlowForge Community Node',
        pluginId: 'flowforge',
        pluginName: 'FlowForge',
        repositoryUrl: 'https://github.com/danstoll/forgehooks-registry/tree/master/integrations/n8n',
        setupSteps: [
          'In n8n, go to Settings > Community Nodes',
          'Install n8n-nodes-flowforge package',
          'Create credentials with your FlowForge URL and API key',
          'The FlowForge node will be available in the workflow editor',
        ],
        actions: [
          { name: 'Execute Plugin', method: 'POST', path: '/execute', description: 'Call any FlowForge plugin endpoint' },
          { name: 'List Plugins', method: 'GET', path: '/plugins', description: 'Get installed plugins' },
        ],
      },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    format: 'External Services + Apex',
    description: 'Call FlowForge services from Salesforce Flow Builder and Apex code.',
    status: 'planned',
    connectors: [],
  },
  {
    id: 'servicenow',
    name: 'ServiceNow',
    format: 'IntegrationHub Spoke',
    description: 'Add FlowForge capabilities to ServiceNow Flow Designer workflows.',
    status: 'planned',
    connectors: [],
  },
  {
    id: 'outsystems',
    name: 'OutSystems',
    format: 'Forge Component',
    description: 'Consume FlowForge REST APIs in OutSystems applications.',
    status: 'planned',
    connectors: [],
  },
  {
    id: 'mendix',
    name: 'Mendix',
    format: 'Marketplace Module',
    description: 'Integrate FlowForge services into Mendix low-code applications.',
    status: 'planned',
    connectors: [],
  },
];

interface UpdateIntegrationBody {
  isEnabled?: boolean;
  config?: Record<string, unknown>;
}

interface CreateIntegrationBody {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  documentationUrl?: string;
  isEnabled?: boolean;
  config?: Record<string, unknown>;
}

/**
 * Integrations Management Routes
 * 
 * Provides endpoints for managing external integration settings.
 * Users can enable/disable integrations and configure them.
 */
export async function integrationsRoutes(fastify: FastifyInstance) {
  
  // ============================================================================
  // List Integrations
  // ============================================================================
  /**
   * GET /api/v1/integrations
   * List all integrations with their enabled status
   */
  fastify.get('/api/v1/integrations', async (_request: FastifyRequest, reply: FastifyReply) => {
    const integrations = await integrationsService.listIntegrations();
    
    return reply.send({
      integrations,
      total: integrations.length,
    });
  });

  // ============================================================================
  // Get Single Integration
  // ============================================================================
  /**
   * GET /api/v1/integrations/:integrationId
   * Get a single integration by ID
   */
  fastify.get<{ Params: IntegrationParams }>(
    '/api/v1/integrations/:integrationId',
    async (request: FastifyRequest<{ Params: IntegrationParams }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      
      const integration = await integrationsService.getIntegration(integrationId);
      
      if (!integration) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.send({
        integration,
      });
    }
  );

  // ============================================================================
  // Update Integration
  // ============================================================================
  /**
   * PATCH /api/v1/integrations/:integrationId
   * Update integration settings (enable/disable, config)
   */
  fastify.patch<{ Params: IntegrationParams; Body: UpdateIntegrationBody }>(
    '/api/v1/integrations/:integrationId',
    async (request: FastifyRequest<{ Params: IntegrationParams; Body: UpdateIntegrationBody }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      const { isEnabled, config } = request.body;
      
      const updates: UpdateIntegrationRequest = {};
      
      if (isEnabled !== undefined) {
        updates.isEnabled = isEnabled;
      }
      
      if (config !== undefined) {
        updates.config = config;
      }

      const integration = await integrationsService.updateIntegration(integrationId, updates);
      
      if (!integration) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.send({
        integration,
      });
    }
  );

  // ============================================================================
  // Enable Integration
  // ============================================================================
  /**
   * POST /api/v1/integrations/:integrationId/enable
   * Enable an integration
   */
  fastify.post<{ Params: IntegrationParams }>(
    '/api/v1/integrations/:integrationId/enable',
    async (request: FastifyRequest<{ Params: IntegrationParams }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      
      const integration = await integrationsService.enableIntegration(integrationId);
      
      if (!integration) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.send({
        integration,
        message: `Integration '${integration.name}' enabled`,
      });
    }
  );

  // ============================================================================
  // Disable Integration
  // ============================================================================
  /**
   * POST /api/v1/integrations/:integrationId/disable
   * Disable an integration
   */
  fastify.post<{ Params: IntegrationParams }>(
    '/api/v1/integrations/:integrationId/disable',
    async (request: FastifyRequest<{ Params: IntegrationParams }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      
      const integration = await integrationsService.disableIntegration(integrationId);
      
      if (!integration) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.send({
        integration,
        message: `Integration '${integration.name}' disabled`,
      });
    }
  );

  // ============================================================================
  // Toggle Integration
  // ============================================================================
  /**
   * POST /api/v1/integrations/:integrationId/toggle
   * Toggle an integration's enabled state
   */
  fastify.post<{ Params: IntegrationParams }>(
    '/api/v1/integrations/:integrationId/toggle',
    async (request: FastifyRequest<{ Params: IntegrationParams }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      
      const integration = await integrationsService.toggleIntegration(integrationId);
      
      if (!integration) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.send({
        integration,
        message: `Integration '${integration.name}' ${integration.isEnabled ? 'enabled' : 'disabled'}`,
      });
    }
  );

  // ============================================================================
  // Create Custom Integration
  // ============================================================================
  /**
   * POST /api/v1/integrations
   * Create a new custom integration
   */
  fastify.post<{ Body: CreateIntegrationBody }>(
    '/api/v1/integrations',
    async (request: FastifyRequest<{ Body: CreateIntegrationBody }>, reply: FastifyReply) => {
      const { id, name, description, icon, documentationUrl, isEnabled, config } = request.body;
      
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Integration ID is required',
          },
        });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Integration name is required',
          },
        });
      }

      // Check if integration already exists
      const existing = await integrationsService.getIntegration(id);
      if (existing) {
        return reply.status(409).send({
          error: {
            code: 'CONFLICT',
            message: `Integration '${id}' already exists`,
          },
        });
      }

      const createRequest: CreateIntegrationRequest = {
        id: id.trim().toLowerCase(),
        name: name.trim(),
        description: description?.trim(),
        icon: icon?.trim(),
        documentationUrl: documentationUrl?.trim(),
        isEnabled: isEnabled ?? false,
        config: config || {},
      };

      const integration = await integrationsService.createIntegration(createRequest);
      
      return reply.status(201).send({
        integration,
      });
    }
  );

  // ============================================================================
  // Delete Integration
  // ============================================================================
  /**
   * DELETE /api/v1/integrations/:integrationId
   * Delete a custom integration (built-in integrations cannot be deleted)
   */
  fastify.delete<{ Params: IntegrationParams }>(
    '/api/v1/integrations/:integrationId',
    async (request: FastifyRequest<{ Params: IntegrationParams }>, reply: FastifyReply) => {
      const { integrationId } = request.params;
      
      // Protect built-in integrations
      const builtInIntegrations = ['nintex', 'make', 'zapier', 'n8n', 'power-automate'];
      if (builtInIntegrations.includes(integrationId)) {
        return reply.status(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'Built-in integrations cannot be deleted',
          },
        });
      }
      
      const deleted = await integrationsService.deleteIntegration(integrationId);
      
      if (!deleted) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: `Integration '${integrationId}' not found`,
          },
        });
      }
      
      return reply.status(204).send();
    }
  );

  // ============================================================================
  // Platform Connectors Catalog
  // ============================================================================
  
  /**
   * GET /api/v1/integrations/platforms
   * Get all platform connectors catalog (for the Integrations page)
   */
  fastify.get('/api/v1/integrations/platforms', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const totalConnectors = PLATFORM_CONNECTORS.reduce((sum, p) => sum + p.connectors.length, 0);
      
      return reply.send({
        platforms: PLATFORM_CONNECTORS,
        totalConnectors,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch platform connectors');
      return reply.status(500).send({
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch platforms',
        },
      });
    }
  });

  /**
   * GET /api/v1/integrations/platforms/:platformId
   * Get connectors for a specific platform
   */
  fastify.get<{ Params: { platformId: string } }>(
    '/api/v1/integrations/platforms/:platformId',
    async (request: FastifyRequest<{ Params: { platformId: string } }>, reply: FastifyReply) => {
      try {
        const { platformId } = request.params;
        const platform = PLATFORM_CONNECTORS.find((p) => p.id === platformId);

        if (!platform) {
          return reply.status(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Platform ${platformId} not found`,
            },
          });
        }

        return reply.send(platform);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch platform');
        return reply.status(500).send({
          error: {
            code: 'FETCH_FAILED',
            message: error instanceof Error ? error.message : 'Failed to fetch platform',
          },
        });
      }
    }
  );
}
