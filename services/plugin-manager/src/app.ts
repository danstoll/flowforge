import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config';
import { logger } from './utils/logger';
import { healthRoutes } from './routes/health';
import { pluginRoutes } from './routes/plugins';
import { registryRoutes } from './routes/registry';
import { dockerService } from './services/docker.service';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // We use our own logger
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  
  await app.register(websocket);

  // Request logging
  app.addHook('onRequest', async (request) => {
    logger.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
    }, 'Request started');
  });

  app.addHook('onResponse', async (request, reply) => {
    logger.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: reply.elapsedTime,
    }, 'Request completed');
  });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error({
      requestId: request.id,
      error: error.message,
      stack: error.stack,
    }, 'Request error');

    reply.status(error.statusCode || 500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: config.environment === 'production' 
          ? 'Internal server error' 
          : error.message,
        requestId: request.id,
      },
    });
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(pluginRoutes);
  await app.register(registryRoutes);

  // WebSocket for real-time events
  app.register(async function (fastify) {
    fastify.get('/ws/events', { websocket: true }, (socket) => {
      logger.info('WebSocket client connected');

      const handler = (event: unknown) => {
        socket.send(JSON.stringify(event));
      };

      dockerService.on('plugin-event', handler);

      socket.on('close', () => {
        dockerService.off('plugin-event', handler);
        logger.info('WebSocket client disconnected');
      });
    });
  });

  return app;
}
