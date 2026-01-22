import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { apiKeyService, CreateApiKeyRequest } from '../services/api-key.service.js';

interface KeyParams {
  keyId: string;
}

interface CreateKeyBody {
  name: string;
  description?: string;
}

interface UpdateKeyBody {
  name?: string;
  description?: string;
}

/**
 * API Keys Management Routes
 * 
 * Provides endpoints for creating, listing, and managing API keys
 * used for external integration authentication.
 */
export async function apiKeysRoutes(fastify: FastifyInstance) {
  
  // ============================================================================
  // List API Keys
  // ============================================================================
  /**
   * GET /api/v1/api-keys
   * List all API keys (keys are not returned, only metadata)
   */
  fastify.get('/api/v1/api-keys', async (_request: FastifyRequest, reply: FastifyReply) => {
    const keys = await apiKeyService.listApiKeys();
    
    return reply.send({
      apiKeys: keys,
      total: keys.length,
    });
  });

  // ============================================================================
  // Create API Key
  // ============================================================================
  /**
   * POST /api/v1/api-keys
   * Create a new API key - the plain text key is only returned once!
   */
  fastify.post<{ Body: CreateKeyBody }>(
    '/api/v1/api-keys',
    async (request: FastifyRequest<{ Body: CreateKeyBody }>, reply: FastifyReply) => {
      const { name, description } = request.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'API key name is required',
          },
        });
      }

      const createRequest: CreateApiKeyRequest = {
        name: name.trim(),
        description: description?.trim(),
      };

      const result = await apiKeyService.createApiKey(createRequest);
      
      return reply.status(201).send({
        apiKey: result.apiKey,
        key: result.plainTextKey, // Only returned once!
        warning: 'Store this API key securely. It will not be shown again.',
      });
    }
  );

  // ============================================================================
  // Get Single API Key
  // ============================================================================
  /**
   * GET /api/v1/api-keys/:keyId
   * Get a single API key by ID (key value not returned)
   */
  fastify.get<{ Params: KeyParams }>(
    '/api/v1/api-keys/:keyId',
    async (request: FastifyRequest<{ Params: KeyParams }>, reply: FastifyReply) => {
      const { keyId } = request.params;
      
      const apiKey = await apiKeyService.getApiKey(keyId);
      
      if (!apiKey) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'API key not found',
          },
        });
      }
      
      return reply.send({
        apiKey,
      });
    }
  );

  // ============================================================================
  // Update API Key
  // ============================================================================
  /**
   * PATCH /api/v1/api-keys/:keyId
   * Update API key name/description
   */
  fastify.patch<{ Params: KeyParams; Body: UpdateKeyBody }>(
    '/api/v1/api-keys/:keyId',
    async (request: FastifyRequest<{ Params: KeyParams; Body: UpdateKeyBody }>, reply: FastifyReply) => {
      const { keyId } = request.params;
      const { name, description } = request.body;
      
      const updates: { name?: string; description?: string } = {};
      
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return reply.status(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'API key name cannot be empty',
            },
          });
        }
        updates.name = name.trim();
      }
      
      if (description !== undefined) {
        updates.description = description?.trim() || undefined;
      }

      const apiKey = await apiKeyService.updateApiKey(keyId, updates);
      
      if (!apiKey) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'API key not found',
          },
        });
      }
      
      return reply.send({
        apiKey,
      });
    }
  );

  // ============================================================================
  // Revoke API Key
  // ============================================================================
  /**
   * POST /api/v1/api-keys/:keyId/revoke
   * Revoke an API key (soft delete - keeps record but disables)
   */
  fastify.post<{ Params: KeyParams }>(
    '/api/v1/api-keys/:keyId/revoke',
    async (request: FastifyRequest<{ Params: KeyParams }>, reply: FastifyReply) => {
      const { keyId } = request.params;
      
      const revoked = await apiKeyService.revokeApiKey(keyId);
      
      if (!revoked) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'API key not found or already revoked',
          },
        });
      }
      
      return reply.send({
        success: true,
        message: 'API key revoked successfully',
      });
    }
  );

  // ============================================================================
  // Delete API Key
  // ============================================================================
  /**
   * DELETE /api/v1/api-keys/:keyId
   * Permanently delete an API key
   */
  fastify.delete<{ Params: KeyParams }>(
    '/api/v1/api-keys/:keyId',
    async (request: FastifyRequest<{ Params: KeyParams }>, reply: FastifyReply) => {
      const { keyId } = request.params;
      
      const deleted = await apiKeyService.deleteApiKey(keyId);
      
      if (!deleted) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'API key not found',
          },
        });
      }
      
      return reply.status(204).send();
    }
  );
}
