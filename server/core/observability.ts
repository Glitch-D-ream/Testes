import * as Sentry from '@sentry/node';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import logger from './logger.js';

/**
 * Observability Module
 * 
 * Integra Sentry para error tracking e Prometheus para métricas
 */

// ============================================================================
// SENTRY CONFIGURATION
// ============================================================================

export function initializeSentry(dsn?: string): void {
  if (!dsn) {
    logger.warn('Sentry DSN not provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    // Integrations are auto-enabled in Sentry 10.x
  });

  logger.info('Sentry initialized', { dsn: dsn.substring(0, 20) + '...' });
}

export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' = 'info'): void {
  Sentry.captureMessage(message, level);
}

// ============================================================================
// PROMETHEUS METRICS
// ============================================================================

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP request in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP response in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

// Application metrics
export const analysisTotal = new Counter({
  name: 'analysis_total',
  help: 'Total number of analyses performed',
  labelNames: ['type', 'status'],
});

export const analysisPromiseCount = new Histogram({
  name: 'analysis_promise_count',
  help: 'Number of promises detected in analysis',
  labelNames: ['type'],
  buckets: [1, 5, 10, 20, 50, 100],
});

export const analysisConfidence = new Histogram({
  name: 'analysis_confidence',
  help: 'Confidence score of analysis',
  labelNames: ['type'],
  buckets: [0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
});

export const analysisProcessingTime = new Histogram({
  name: 'analysis_processing_time_seconds',
  help: 'Time to process analysis in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Database metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const databaseQueryTotal = new Counter({
  name: 'database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

// Scout metrics (Passo 2.4)
export const scoutSourceLatency = new Histogram({
  name: 'scout_source_latency_seconds',
  help: 'Latency of scout sources in seconds',
  labelNames: ['source'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const scoutSourceErrors = new Counter({
  name: 'scout_source_errors_total',
  help: 'Total number of errors in scout sources',
  labelNames: ['source'],
});

export const scoutCircuitBreakerState = new Gauge({
  name: 'scout_circuit_breaker_state',
  help: 'State of the scout circuit breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
  labelNames: ['resource'],
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Size of cache in bytes',
  labelNames: ['cache_name'],
});

// System metrics
export const systemUptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
});

export const systemMemoryUsage = new Gauge({
  name: 'system_memory_usage_bytes',
  help: 'System memory usage in bytes',
  labelNames: ['type'],
});

export const systemCpuUsage = new Gauge({
  name: 'system_cpu_usage_percent',
  help: 'System CPU usage percentage',
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

// ============================================================================
// METRICS COLLECTION
// ============================================================================

export function startMetricsCollection(): void {
  const startTime = Date.now();

  // Update system metrics every 10 seconds
  setInterval(() => {
    try {
      const uptime = (Date.now() - startTime) / 1000;
      systemUptime.set(uptime);

      // Memory usage
      const memUsage = process.memoryUsage();
      systemMemoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
      systemMemoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
      systemMemoryUsage.set({ type: 'external' }, memUsage.external);
      systemMemoryUsage.set({ type: 'rss' }, memUsage.rss);

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      const cpuPercent = Math.min(100, (totalCpuTime / uptime) * 100);
      systemCpuUsage.set(cpuPercent);
    } catch (error) {
      logger.warn('Error collecting system metrics', { error });
    }
  }, 10000);

  logger.info('Metrics collection started');
}

// ============================================================================
// PROMETHEUS ENDPOINT
// ============================================================================

export async function getMetricsEndpoint(): Promise<string> {
  return register.metrics();
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'ok' | 'warning' | 'error';
      message?: string;
      details?: any;
    };
  };
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {};

  // Memory check
  const memUsage = process.memoryUsage();
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = {
    status: heapUsagePercent > 90 ? 'error' : heapUsagePercent > 75 ? 'warning' : 'ok',
    message: `Heap usage: ${heapUsagePercent.toFixed(2)}%`,
    details: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    },
  };

  // Database check (placeholder)
  checks.database = {
    status: 'ok' as const,
    message: 'Database connection OK',
  };

  // API check (placeholder)
  checks.api = {
    status: 'ok' as const,
    message: 'API responding',
  };

  // Determine overall status
  const errorCount = Object.values(checks).filter(c => c.status === 'error').length;
  const warningCount = Object.values(checks).filter(c => c.status === 'warning').length;

  const status: HealthCheckResult['status'] =
    errorCount > 0 ? 'unhealthy' : warningCount > 0 ? 'degraded' : 'healthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  };
}

// ============================================================================
// ERROR TRACKING MIDDLEWARE
// ============================================================================

export function errorTrackingMiddleware(err: any, req: any, res: any, next: any): void {
  // Capture to Sentry
  Sentry.captureException(err, {
    contexts: {
      express: {
        method: req.method,
        url: req.url,
      },
    },
  });

  // Log error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });

  // Send response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    requestId: Sentry.lastEventId(),
  });
}

// ============================================================================
// REQUEST TRACING MIDDLEWARE
// ============================================================================

export function requestTracingMiddleware(req: any, res: any, next: any): void {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Capture response
  const originalSend = res.send as Function;
  res.send = function (data: any) {
    const duration = (Date.now() - startTime) / 1000;
    const memoryDelta = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;

    // Extract route (remove query params and IDs)
    const route = req.route?.path || req.path.split('?')[0];

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    if (req.get('content-length')) {
      httpRequestSize.observe(
        { method: req.method, route },
        parseInt(req.get('content-length'))
      );
    }

    if (res.get('content-length')) {
      httpResponseSize.observe(
        { method: req.method, route, status_code: res.statusCode },
        parseInt(res.get('content-length'))
      );
    }

    // Log request
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: duration.toFixed(3),
      memoryDelta: memoryDelta.toFixed(2),
    });

    // Call original send
    return (originalSend as Function).call(this, data);
  };

  next();
}

// Exports are already defined individually above
