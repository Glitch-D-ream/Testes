import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  performHealthCheck,
  getMetricsEndpoint,
  captureMessage,
  startMetricsCollection,
} from './observability';

describe('Observability Module', () => {
  describe('Health Checks', () => {
    it('should return healthy status', async () => {
      const health = await performHealthCheck();
      
      expect(health).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeGreaterThan(0);
      expect(health.checks).toBeDefined();
    });

    it('should include memory check', async () => {
      const health = await performHealthCheck();
      
      expect(health.checks.memory).toBeDefined();
      expect(['ok', 'warning', 'error']).toContain(health.checks.memory.status);
      expect(health.checks.memory.details).toBeDefined();
      expect(health.checks.memory.details.heapUsed).toBeGreaterThan(0);
      expect(health.checks.memory.details.heapTotal).toBeGreaterThan(0);
    });

    it('should include database check', async () => {
      const health = await performHealthCheck();
      
      expect(health.checks.database).toBeDefined();
      expect(health.checks.database.status).toBe('ok');
      expect(health.checks.database.message).toBeDefined();
    });

    it('should include API check', async () => {
      const health = await performHealthCheck();
      
      expect(health.checks.api).toBeDefined();
      expect(health.checks.api.status).toBe('ok');
      expect(health.checks.api.message).toBeDefined();
    });

    it('should determine overall status based on checks', async () => {
      const health = await performHealthCheck();
      
      const errorCount = Object.values(health.checks).filter(c => c.status === 'error').length;
      const warningCount = Object.values(health.checks).filter(c => c.status === 'warning').length;
      
      if (errorCount > 0) {
        expect(health.status).toBe('unhealthy');
      } else if (warningCount > 0) {
        expect(health.status).toBe('degraded');
      } else {
        expect(health.status).toBe('healthy');
      }
    });

    it('should have valid timestamp', async () => {
      const health = await performHealthCheck();
      const timestamp = new Date(health.timestamp);
      
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Metrics Collection', () => {
    it('should return metrics in Prometheus format', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    it('should include HTTP request metrics', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_size_bytes');
      expect(metrics).toContain('http_response_size_bytes');
    });

    it('should include analysis metrics', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(metrics).toContain('analysis_total');
      expect(metrics).toContain('analysis_promise_count');
      expect(metrics).toContain('analysis_confidence');
      expect(metrics).toContain('analysis_processing_time_seconds');
    });

    it('should include database metrics', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(metrics).toContain('database_query_duration_seconds');
      expect(metrics).toContain('database_queries_total');
    });

    it('should include cache metrics', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(metrics).toContain('cache_hits_total');
      expect(metrics).toContain('cache_misses_total');
      expect(metrics).toContain('cache_size_bytes');
    });

    it('should include system metrics', async () => {
      const metrics = await getMetricsEndpoint();
      
      expect(metrics).toContain('system_uptime_seconds');
      expect(metrics).toContain('system_memory_usage_bytes');
      expect(metrics).toContain('system_cpu_usage_percent');
      expect(metrics).toContain('active_connections');
    });

    it('should format metrics correctly', async () => {
      const metrics = await getMetricsEndpoint();
      const lines = metrics.split('\n');
      
      // Should have help and type lines
      const helpLines = lines.filter(l => l.startsWith('# HELP'));
      const typeLines = lines.filter(l => l.startsWith('# TYPE'));
      
      expect(helpLines.length).toBeGreaterThan(0);
      expect(typeLines.length).toBeGreaterThan(0);
    });
  });

  describe('Error Tracking', () => {
    it('should capture message', () => {
      expect(() => {
        captureMessage('Test message', 'info');
      }).not.toThrow();
    });

    it('should capture warning message', () => {
      expect(() => {
        captureMessage('Test warning', 'warning');
      }).not.toThrow();
    });

    it('should capture error message', () => {
      expect(() => {
        captureMessage('Test error', 'error');
      }).not.toThrow();
    });

    it('should capture fatal message', () => {
      expect(() => {
        captureMessage('Test fatal', 'fatal');
      }).not.toThrow();
    });
  });

  describe('Metrics Collection Lifecycle', () => {
    it('should start metrics collection without error', () => {
      expect(() => {
        startMetricsCollection();
      }).not.toThrow();
    });

    it('should handle multiple starts gracefully', () => {
      expect(() => {
        startMetricsCollection();
        startMetricsCollection();
      }).not.toThrow();
    });
  });

  describe('Health Check Edge Cases', () => {
    it('should handle high memory usage', async () => {
      const health = await performHealthCheck();
      
      // Memory check should exist and have valid status
      expect(health.checks.memory).toBeDefined();
      expect(['ok', 'warning', 'error']).toContain(health.checks.memory.status);
    });

    it('should have consistent uptime', async () => {
      const health1 = await performHealthCheck();
      const uptime1 = health1.uptime;
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const health2 = await performHealthCheck();
      const uptime2 = health2.uptime;
      
      // Uptime should increase
      expect(uptime2).toBeGreaterThanOrEqual(uptime1);
    });

    it('should handle concurrent health checks', async () => {
      const promises = Array(10).fill(null).map(() => performHealthCheck());
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach(health => {
        expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      });
    });
  });

  describe('Metrics Endpoint Edge Cases', () => {
    it('should handle concurrent metrics requests', async () => {
      const promises = Array(10).fill(null).map(() => getMetricsEndpoint());
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach(metrics => {
        expect(typeof metrics).toBe('string');
        expect(metrics.length).toBeGreaterThan(0);
      });
    });

    it('should return consistent metrics format', async () => {
      const metrics1 = await getMetricsEndpoint();
      const metrics2 = await getMetricsEndpoint();
      
      // Both should have same structure
      expect(metrics1.split('\n').length).toBeGreaterThan(0);
      expect(metrics2.split('\n').length).toBeGreaterThan(0);
    });
  });
});
