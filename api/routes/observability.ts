import { Router, Request, Response } from 'express';
import {
  getMetricsEndpoint,
  performHealthCheck,
} from '../core/observability';
import logger from '../core/logger';

const router = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * 
 * Response: Plain text Prometheus metrics format
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getMetricsEndpoint();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Error retrieving metrics', { error });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 * 
 * Response:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "ISO8601",
 *   "uptime": 1234.56,
 *   "checks": {
 *     "memory": { "status": "ok", "message": "...", "details": {...} },
 *     "database": { "status": "ok", "message": "..." },
 *     "api": { "status": "ok", "message": "..." }
 *   }
 * }
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();
    
    // Set HTTP status based on health status
    const statusCode = 
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 503 :
      500;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Error performing health check', { error });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to perform health check',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/live
 * Liveness probe (is the service running?)
 * 
 * Response: 200 OK if running
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * GET /health/ready
 * Readiness probe (is the service ready to handle requests?)
 * 
 * Response: 200 OK if ready, 503 if not
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const health = await performHealthCheck();
    
    if (health.status === 'unhealthy') {
      return res.status(503).json({ status: 'not_ready', reason: 'Service unhealthy' });
    }

    res.status(200).json({ status: 'ready' });
  } catch (error) {
    logger.error('Error checking readiness', { error });
    res.status(503).json({ status: 'not_ready', reason: 'Health check failed' });
  }
});

/**
 * GET /version
 * Version and build information
 * 
 * Response:
 * {
 *   "version": "1.0.0",
 *   "buildTime": "2026-01-21T17:40:00Z",
 *   "environment": "production",
 *   "nodeVersion": "v22.13.0"
 * }
 */
router.get('/version', (req: Request, res: Response) => {
  const packageJson = require('../../package.json');
  
  res.json({
    version: packageJson.version || '1.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime(),
  });
});

export default router;
