import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initializeScheduler,
  stopScheduler,
  getJobStatus,
  getAllJobsStatus,
  isSchedulerActive,
  restartScheduler,
} from './scheduler.js';

describe('Job Scheduler', () => {
  afterEach(() => {
    // Limpar scheduler após cada teste
    stopScheduler();
  });

  describe('initializeScheduler', () => {
    it('deve inicializar scheduler sem erros', () => {
      expect(() => {
        initializeScheduler();
      }).not.toThrow();
    });

    it('deve agendar múltiplos jobs', () => {
      initializeScheduler();

      const jobs = getAllJobsStatus();
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('deve ter jobs com nomes válidos', () => {
      initializeScheduler();

      const jobs = getAllJobsStatus();
      const jobNames = jobs.map((j) => j.name);

      expect(jobNames).toContain('full-sync');
      expect(jobNames).toContain('incremental-sync');
      expect(jobNames).toContain('cleanup');
    });
  });

  describe('stopScheduler', () => {
    it('deve parar scheduler', () => {
      initializeScheduler();
      expect(isSchedulerActive()).toBe(true);

      stopScheduler();
      expect(isSchedulerActive()).toBe(false);
    });

    it('deve limpar todas as tarefas', () => {
      initializeScheduler();
      stopScheduler();

      const jobs = getAllJobsStatus();
      expect(jobs.length).toBe(0);
    });
  });

  describe('getJobStatus', () => {
    beforeEach(() => {
      initializeScheduler();
    });

    it('deve retornar status de job existente', () => {
      const status = getJobStatus('full-sync');

      expect(status).not.toBeNull();
      expect(status?.name).toBe('full-sync');
      expect(typeof status?.running).toBe('boolean');
    });

    it('deve retornar null para job inexistente', () => {
      const status = getJobStatus('job-inexistente');

      expect(status).toBeNull();
    });

    it('deve indicar que job está rodando', () => {
      const status = getJobStatus('full-sync');

      expect(status?.running).toBe(true);
    });
  });

  describe('getAllJobsStatus', () => {
    beforeEach(() => {
      initializeScheduler();
    });

    it('deve retornar array de jobs', () => {
      const jobs = getAllJobsStatus();

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('cada job deve ter campos obrigatórios', () => {
      const jobs = getAllJobsStatus();

      jobs.forEach((job) => {
        expect(job.name).toBeDefined();
        expect(typeof job.running).toBe('boolean');
        expect(job.nextDate === null || job.nextDate instanceof Date).toBe(true);
      });
    });

    it('deve retornar array vazio após parar scheduler', () => {
      stopScheduler();

      const jobs = getAllJobsStatus();
      expect(jobs.length).toBe(0);
    });
  });

  describe('isSchedulerActive', () => {
    it('deve retornar false inicialmente', () => {
      expect(isSchedulerActive()).toBe(false);
    });

    it('deve retornar true após inicializar', () => {
      initializeScheduler();

      expect(isSchedulerActive()).toBe(true);
    });

    it('deve retornar false após parar', () => {
      initializeScheduler();
      stopScheduler();

      expect(isSchedulerActive()).toBe(false);
    });
  });

  describe('restartScheduler', () => {
    it('deve reiniciar scheduler', () => {
      initializeScheduler();
      const jobsBefore = getAllJobsStatus().length;

      restartScheduler();
      const jobsAfter = getAllJobsStatus().length;

      expect(jobsAfter).toBe(jobsBefore);
      expect(isSchedulerActive()).toBe(true);
    });

    it('deve parar e reiniciar', () => {
      initializeScheduler();
      stopScheduler();

      expect(isSchedulerActive()).toBe(false);

      restartScheduler();

      expect(isSchedulerActive()).toBe(true);
    });
  });

  describe('Job Scheduling', () => {
    beforeEach(() => {
      initializeScheduler();
    });

    it('deve ter job de sincronização completa', () => {
      const status = getJobStatus('full-sync');

      expect(status).not.toBeNull();
      expect(status?.name).toBe('full-sync');
    });

    it('deve ter job de sincronização incremental', () => {
      const status = getJobStatus('incremental-sync');

      expect(status).not.toBeNull();
      expect(status?.name).toBe('incremental-sync');
    });

    it('deve ter job de limpeza', () => {
      const status = getJobStatus('cleanup');

      expect(status).not.toBeNull();
      expect(status?.name).toBe('cleanup');
    });

    it('todos os jobs devem estar rodando', () => {
      const jobs = getAllJobsStatus();

      jobs.forEach((job) => {
        expect(job.running).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com múltiplas inicializações', () => {
      expect(() => {
        initializeScheduler();
        initializeScheduler();
      }).not.toThrow();
    });

    it('deve lidar com múltiplas paradas', () => {
      initializeScheduler();

      expect(() => {
        stopScheduler();
        stopScheduler();
      }).not.toThrow();
    });

    it('deve lidar com parada sem inicialização', () => {
      expect(() => {
        stopScheduler();
      }).not.toThrow();
    });

    it('deve lidar com getJobStatus sem inicialização', () => {
      const status = getJobStatus('full-sync');

      expect(status).toBeNull();
    });

    it('deve retornar array vazio para getAllJobsStatus sem inicialização', () => {
      const jobs = getAllJobsStatus();

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBe(0);
    });
  });
});
