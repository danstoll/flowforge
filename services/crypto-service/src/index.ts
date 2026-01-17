import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { healthRoutes } from './routes/health';
import { hashRoutes } from './routes/hash';
import { encryptRoutes } from './routes/encrypt';
import { decryptRoutes } from './routes/decrypt';
import { keyRoutes } from './routes/key';
import { openApiSpec } from './openapi';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use(requestId);

// Logging
app.use(pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
    if (res.statusCode >= 500 || err) return 'error';
    return 'info';
  },
}));

// Health & Metrics routes (no prefix)
app.use('/', healthRoutes);

// OpenAPI spec
app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

// API routes
app.use('/api/v1/crypto', hashRoutes);
app.use('/api/v1/crypto', encryptRoutes);
app.use('/api/v1/crypto', decryptRoutes);
app.use('/api/v1/crypto', keyRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const server = app.listen(config.port, () => {
  logger.info({
    port: config.port,
    environment: config.nodeEnv,
  }, `Crypto service started on port ${config.port}`);
});

export { app, server };
