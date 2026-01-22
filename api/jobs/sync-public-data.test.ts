import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSyncStatus,
  updateSyncStatus,
  initializeSyncSystem,
} from './sync-public-data.js';

describe('Sync Public Data Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset sync status
    updateSyncStatus({
      lastSync: null,
      nextSync: null,
      status: 'idle',
      lastError: null,
      successCount: 0,
      failureCount: 0,
    });
  });

  describe('getSyncStatus', () => {
    it('deve retornar status inicial', () => {
      const status = getSyncStatus();

      expect(status.status).toBe('idle');
      expect(status.lastSync).toBeNull();
      expect(status.lastError).toBeNull();
      expect(status.successCount).toBe(0);
      expect(status.failureCount).toBe(0);
    });

    it('deve retornar cópia do status (não referência)', () => {
      const status1 = getSyncStatus();
      const status2 = getSyncStatus();

      status1.status = 'syncing';

      expect(status2.status).toBe('idle');
    });
  });

  describe('updateSyncStatus', () => {
    it('deve atualizar status', () => {
      updateSyncStatus({ status: 'syncing' });

      const status = getSyncStatus();
      expect(status.status).toBe('syncing');
    });

    it('deve atualizar múltiplos campos', () => {
      updateSyncStatus({
        status: 'syncing',
        lastSync: new Date(),
        successCount: 5,
      });

      const status = getSyncStatus();
      expect(status.status).toBe('syncing');
      expect(status.lastSync).not.toBeNull();
      expect(status.successCount).toBe(5);
    });

    it('deve preservar campos não atualizados', () => {
      updateSyncStatus({ status: 'syncing' });
      updateSyncStatus({ successCount: 3 });

      const status = getSyncStatus();
      expect(status.status).toBe('syncing');
      expect(status.successCount).toBe(3);
    });

    it('deve incrementar successCount', () => {
      updateSyncStatus({ successCount: 1 });
      updateSyncStatus({ successCount: 2 });

      const status = getSyncStatus();
      expect(status.successCount).toBe(2);
    });

    it('deve incrementar failureCount', () => {
      updateSyncStatus({ failureCount: 1 });
      updateSyncStatus({ failureCount: 2 });

      const status = getSyncStatus();
      expect(status.failureCount).toBe(2);
    });
  });

  describe('Sync Status Transitions', () => {
    it('deve transicionar de idle para syncing', () => {
      let status = getSyncStatus();
      expect(status.status).toBe('idle');

      updateSyncStatus({ status: 'syncing' });
      status = getSyncStatus();
      expect(status.status).toBe('syncing');
    });

    it('deve transicionar de syncing para idle após sucesso', () => {
      updateSyncStatus({ status: 'syncing' });
      updateSyncStatus({
        status: 'idle',
        lastSync: new Date(),
        successCount: 1,
      });

      const status = getSyncStatus();
      expect(status.status).toBe('idle');
      expect(status.lastSync).not.toBeNull();
      expect(status.successCount).toBe(1);
    });

    it('deve transicionar de syncing para error', () => {
      updateSyncStatus({ status: 'syncing' });
      updateSyncStatus({
        status: 'error',
        lastError: 'Erro de conexão',
        failureCount: 1,
      });

      const status = getSyncStatus();
      expect(status.status).toBe('error');
      expect(status.lastError).toBe('Erro de conexão');
      expect(status.failureCount).toBe(1);
    });

    it('deve recuperar de erro para idle', () => {
      updateSyncStatus({
        status: 'error',
        lastError: 'Erro anterior',
      });

      updateSyncStatus({
        status: 'idle',
        lastSync: new Date(),
        lastError: null,
        successCount: 1,
      });

      const status = getSyncStatus();
      expect(status.status).toBe('idle');
      expect(status.lastError).toBeNull();
      expect(status.successCount).toBe(1);
    });
  });

  describe('Sync Metrics', () => {
    it('deve rastrear sucessos e falhas', () => {
      updateSyncStatus({ successCount: 5, failureCount: 2 });

      const status = getSyncStatus();
      expect(status.successCount).toBe(5);
      expect(status.failureCount).toBe(2);
    });

    it('deve rastrear última sincronização', () => {
      const now = new Date();
      updateSyncStatus({ lastSync: now });

      const status = getSyncStatus();
      expect(status.lastSync).toEqual(now);
    });

    it('deve rastrear próxima sincronização', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      updateSyncStatus({ nextSync: tomorrow });

      const status = getSyncStatus();
      expect(status.nextSync).toEqual(tomorrow);
    });

    it('deve rastrear último erro', () => {
      const errorMsg = 'Falha ao conectar com SICONFI';
      updateSyncStatus({ lastError: errorMsg });

      const status = getSyncStatus();
      expect(status.lastError).toBe(errorMsg);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com múltiplas atualizações rápidas', () => {
      for (let i = 0; i < 10; i++) {
        updateSyncStatus({ successCount: i });
      }

      const status = getSyncStatus();
      expect(status.successCount).toBe(9);
    });

    it('deve manter status válido após atualização parcial', () => {
      updateSyncStatus({
        status: 'syncing',
        lastSync: new Date(),
        successCount: 5,
      });

      updateSyncStatus({ status: 'idle' });

      const status = getSyncStatus();
      expect(status.status).toBe('idle');
      expect(status.lastSync).not.toBeNull();
      expect(status.successCount).toBe(5);
    });

    it('deve lidar com null em lastError', () => {
      updateSyncStatus({ lastError: 'Erro' });
      updateSyncStatus({ lastError: null });

      const status = getSyncStatus();
      expect(status.lastError).toBeNull();
    });

    it('deve lidar com null em lastSync', () => {
      updateSyncStatus({ lastSync: new Date() });
      updateSyncStatus({ lastSync: null });

      const status = getSyncStatus();
      expect(status.lastSync).toBeNull();
    });
  });

  describe('Status Validation', () => {
    it('deve ter status válido', () => {
      const validStatuses = ['idle', 'syncing', 'error'];

      updateSyncStatus({ status: 'idle' });
      let status = getSyncStatus();
      expect(validStatuses).toContain(status.status);

      updateSyncStatus({ status: 'syncing' });
      status = getSyncStatus();
      expect(validStatuses).toContain(status.status);

      updateSyncStatus({ status: 'error' });
      status = getSyncStatus();
      expect(validStatuses).toContain(status.status);
    });

    it('deve ter counters não-negativos', () => {
      updateSyncStatus({ successCount: 10, failureCount: 5 });

      const status = getSyncStatus();
      expect(status.successCount).toBeGreaterThanOrEqual(0);
      expect(status.failureCount).toBeGreaterThanOrEqual(0);
    });
  });
});
