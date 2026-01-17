import { Router, Request, Response } from 'express';

const router = Router();

const startTime = Date.now();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'crypto-service',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

router.get('/metrics', (_req: Request, res: Response) => {
  const uptime = (Date.now() - startTime) / 1000;
  
  const metrics = `
# HELP crypto_service_uptime_seconds Service uptime in seconds
# TYPE crypto_service_uptime_seconds gauge
crypto_service_uptime_seconds ${uptime}

# HELP crypto_service_info Service information
# TYPE crypto_service_info gauge
crypto_service_info{version="1.0.0"} 1
  `.trim();
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export { router as healthRoutes };
