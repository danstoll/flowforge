import { buildApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { databaseService } from './services/database.service';
import { dockerService } from './services/docker.service';
import { registryService } from './services/registry.service';

async function main() {
  logger.info({
    environment: config.environment,
    port: config.port,
  }, 'Starting Plugin Manager');

  // ==========================================================================
  // 1. Connect to Database
  // ==========================================================================
  try {
    await databaseService.connect();
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ error }, 'Cannot connect to database. Exiting.');
    process.exit(1);
  }

  // ==========================================================================
  // 2. Run Database Migrations
  // ==========================================================================
  try {
    await databaseService.runMigrations();
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error({ error }, 'Database migration failed. Exiting.');
    process.exit(1);
  }

  // ==========================================================================
  // 3. Check Docker Connectivity
  // ==========================================================================
  const dockerOk = await dockerService.ping();
  if (!dockerOk) {
    logger.error('Cannot connect to Docker. Exiting.');
    process.exit(1);
  }
  logger.info('Docker connection established');

  // ==========================================================================
  // 4. Load Plugin Registry
  // ==========================================================================
  try {
    await registryService.loadRegistry();
    logger.info('Plugin registry loaded');
  } catch (error) {
    logger.error({ error }, 'Failed to load registry');
    // Continue anyway - service can still operate with empty registry
  }

  // ==========================================================================
  // 5. Initialize Docker Service (Load from DB + Sync with Docker)
  // ==========================================================================
  try {
    await dockerService.initialize();
    logger.info('Docker service initialized with database sync');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Docker service');
    // Continue anyway - service can still operate
  }

  // ==========================================================================
  // 6. Build and Start Fastify App
  // ==========================================================================
  const app = await buildApp();

  // ==========================================================================
  // Graceful Shutdown
  // ==========================================================================
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    try {
      // Close HTTP server
      await app.close();
      logger.info('Server closed');

      // Close database connection
      await databaseService.disconnect();
      logger.info('Database connection closed');

      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ==========================================================================
  // Start Server
  // ==========================================================================
  try {
    await app.listen({
      port: config.port,
      host: '0.0.0.0'
    });

    logger.info({
      port: config.port,
      url: `http://localhost:${config.port}`,
    }, 'Plugin Manager started successfully');

    // Log startup summary
    const plugins = dockerService.listPlugins();
    const runningPlugins = plugins.filter(p => p.status === 'running').length;

    logger.info({
      totalPlugins: plugins.length,
      runningPlugins,
      stoppedPlugins: plugins.length - runningPlugins,
    }, 'Plugin Manager ready');

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error({ error }, 'Unhandled error');
  process.exit(1);
});
