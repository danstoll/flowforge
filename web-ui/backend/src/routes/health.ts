import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dockerService } from '../services/docker.service';
import { kongService } from '../services/kong.service';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const dockerOk = await dockerService.ping();
    const kongOk = await kongService.isHealthy();
    
    const status = dockerOk && kongOk ? 'healthy' : 'degraded';
    const statusCode = status === 'healthy' ? 200 : 503;
    
    return reply.status(statusCode).send({
      status,
      service: 'plugin-manager',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        docker: dockerOk ? 'healthy' : 'unhealthy',
        kong: kongOk ? 'healthy' : 'unhealthy',
      },
      plugins: {
        total: dockerService.listPlugins().length,
        running: dockerService.listPlugins().filter(p => p.status === 'running').length,
      },
    });
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const dockerOk = await dockerService.ping();
    
    if (!dockerOk) {
      return reply.status(503).send({
        ready: false,
        reason: 'Docker not available',
      });
    }
    
    return reply.send({
      ready: true,
    });
  });
}
