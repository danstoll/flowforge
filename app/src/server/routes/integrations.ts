import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { integrationsService, UpdateIntegrationRequest, CreateIntegrationRequest } from '../services/integrations.service.js';

interface IntegrationParams {
  integrationId: string;
}

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
}
