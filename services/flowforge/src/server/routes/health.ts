import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dockerService } from '../services/docker.service.js';
import { databaseService } from '../services/database.service.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const dockerOk = await dockerService.ping();
    const dbOk = await databaseService.isHealthy();

    const status = dockerOk && dbOk ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : 503;

    return reply.status(statusCode).send({
      status,
      service: 'flowforge',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        docker: dockerOk ? 'healthy' : 'unhealthy',
        database: dbOk ? 'healthy' : 'unhealthy',
      },
      plugins: {
        total: dockerService.listPlugins().length,
        running: dockerService.listPlugins().filter(p => p.status === 'running').length,
      },
    });
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const dockerOk = await dockerService.ping();
    const dbOk = await databaseService.isHealthy();

    if (!dockerOk || !dbOk) {
      return reply.status(503).send({
        ready: false,
        reason: !dockerOk ? 'Docker not available' : 'Database not available',
      });
    }

    return reply.send({
      ready: true,
    });
  });
}
