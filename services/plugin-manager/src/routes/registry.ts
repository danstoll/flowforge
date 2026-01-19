import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registryService } from '../services/registry.service';
import { logger } from '../utils/logger';
import { ForgeHookCategory } from '../types';

// Request types
interface ListPluginsQuery {
  category?: ForgeHookCategory;
  verified?: string;
  featured?: string;
  search?: string;
}

interface PluginParams {
  pluginId: string;
}

interface SearchQuery {
  q: string;
}

interface CategoryParams {
  category: ForgeHookCategory;
}

export async function registryRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // List Available Plugins
  // ============================================================================
  fastify.get<{ Querystring: ListPluginsQuery }>(
    '/api/v1/registry/plugins',
    async (request, reply) => {
      const { category, verified, featured, search } = request.query;

      const filters: any = {};

      if (category) filters.category = category;
      if (verified !== undefined) filters.verified = verified === 'true';
      if (featured !== undefined) filters.featured = featured === 'true';
      if (search) filters.search = search;

      const plugins = registryService.listPlugins(filters);

      return reply.send({
        plugins,
        total: plugins.length,
      });
    }
  );

  // ============================================================================
  // Get Plugin Details
  // ============================================================================
  fastify.get<{ Params: PluginParams }>(
    '/api/v1/registry/plugins/:pluginId',
    async (request, reply) => {
      const { pluginId } = request.params;

      const plugin = registryService.getPlugin(pluginId);

      if (!plugin) {
        return reply.status(404).send({
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found in registry`,
          },
        });
      }

      return reply.send(plugin);
    }
  );

  // ============================================================================
  // Search Plugins
  // ============================================================================
  fastify.get<{ Querystring: SearchQuery }>(
    '/api/v1/registry/search',
    async (request, reply) => {
      const { q } = request.query;

      if (!q || q.trim().length === 0) {
        return reply.status(400).send({
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query cannot be empty',
          },
        });
      }

      const plugins = registryService.searchPlugins(q);

      return reply.send({
        query: q,
        plugins,
        total: plugins.length,
      });
    }
  );

  // ============================================================================
  // Get Plugins by Category
  // ============================================================================
  fastify.get<{ Params: CategoryParams }>(
    '/api/v1/registry/categories/:category',
    async (request, reply) => {
      const { category } = request.params;

      const plugins = registryService.getPluginsByCategory(category);

      return reply.send({
        category,
        plugins,
        total: plugins.length,
      });
    }
  );

  // ============================================================================
  // Get All Categories
  // ============================================================================
  fastify.get(
    '/api/v1/registry/categories',
    async (request, reply) => {
      const categories = registryService.getCategories();

      return reply.send({
        categories,
        total: categories.length,
      });
    }
  );

  // ============================================================================
  // Get Featured Plugins
  // ============================================================================
  fastify.get(
    '/api/v1/registry/featured',
    async (request, reply) => {
      const plugins = registryService.getFeaturedPlugins();

      return reply.send({
        plugins,
        total: plugins.length,
      });
    }
  );

  // ============================================================================
  // Get Popular Plugins
  // ============================================================================
  fastify.get(
    '/api/v1/registry/popular',
    async (request, reply) => {
      const plugins = registryService.getPopularPlugins(10);

      return reply.send({
        plugins,
        total: plugins.length,
      });
    }
  );

  // ============================================================================
  // Get Registry Stats
  // ============================================================================
  fastify.get(
    '/api/v1/registry/stats',
    async (request, reply) => {
      const stats = registryService.getStats();

      return reply.send(stats);
    }
  );

  // ============================================================================
  // Reload Registry (Admin endpoint)
  // ============================================================================
  fastify.post(
    '/api/v1/registry/reload',
    async (request, reply) => {
      logger.info('Registry reload requested');

      try {
        await registryService.reloadRegistry();

        return reply.send({
          message: 'Registry reloaded successfully',
          pluginCount: registryService.getRegistryInfo().pluginCount,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to reload registry');

        return reply.status(500).send({
          error: {
            code: 'RELOAD_FAILED',
            message: error instanceof Error ? error.message : 'Failed to reload registry',
          },
        });
      }
    }
  );

  // ============================================================================
  // Get Registry Info
  // ============================================================================
  fastify.get(
    '/api/v1/registry/info',
    async (request, reply) => {
      const info = registryService.getRegistryInfo();

      return reply.send(info);
    }
  );
}
