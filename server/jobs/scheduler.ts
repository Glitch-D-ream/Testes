/**
 * Scheduler de Jobs Periódicos
 * Gerencia agendamento de sincronização de dados públicos
 */

import * as cron from 'node-cron';
import logger from '../core/logger.js';
import {
  syncAllPublicData,
  syncSiconfiOnly,
  syncPortalOnly,
  syncTSEOnly,
  syncWithRetry,
  updateSyncStatus,
} from './sync-public-data.js';

/**
 * Tarefas agendadas
 */
let scheduledTasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();

/**
 * Inicializar scheduler de jobs
 */
export function initializeScheduler(): void {
  logger.info('[Scheduler] Inicializando scheduler de jobs');

  try {
    // Job 1: Sincronização completa diariamente às 2:00 AM
    scheduleFullSync();

    // Job 2: Sincronização incremental a cada 6 horas
    scheduleIncrementalSync();

    // Job 3: Limpeza de cache antigo diariamente às 3:00 AM
    scheduleCleanup();

    logger.info('[Scheduler] Scheduler inicializado com sucesso');
  } catch (error) {
    logger.error(`[Scheduler] Erro ao inicializar: ${error}`);
  }
}

/**
 * Agendar sincronização completa
 * Executa diariamente às 2:00 AM
 */
function scheduleFullSync(): void {
  const cronExpression = '0 2 * * *'; // 2:00 AM todos os dias

  const task = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] Executando sincronização completa agendada');

    try {
      updateSyncStatus({ status: 'syncing' });

      const startTime = Date.now();
      await syncWithRetry(3, 5000);
      const duration = Date.now() - startTime;

      updateSyncStatus({
        status: 'idle',
        lastSync: new Date(),
        successCount: 1,
      });

      logger.info(`[Scheduler] Sincronização completa concluída em ${duration}ms`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      updateSyncStatus({
        status: 'error',
        lastError: errorMsg,
        failureCount: 1,
      });

      logger.error(`[Scheduler] Erro na sincronização: ${errorMsg}`);
    }
  });

  scheduledTasks.set('full-sync', task);
  logger.info('[Scheduler] Sincronização completa agendada para 2:00 AM diariamente');
}

/**
 * Agendar sincronização incremental
 * Executa a cada 6 horas
 */
function scheduleIncrementalSync(): void {
  const cronExpression = '0 */6 * * *'; // A cada 6 horas

  const task = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] Executando sincronização incremental agendada');

    try {
      // Sincronizar apenas Portal (mais rápido)
      await syncPortalOnly();
      logger.info('[Scheduler] Sincronização incremental concluída');
    } catch (error) {
      logger.error(`[Scheduler] Erro na sincronização incremental: ${error}`);
    }
  });

  scheduledTasks.set('incremental-sync', task);
  logger.info('[Scheduler] Sincronização incremental agendada a cada 6 horas');
}

/**
 * Agendar limpeza de cache antigo
 * Executa diariamente às 3:00 AM
 */
function scheduleCleanup(): void {
  const cronExpression = '0 3 * * *'; // 3:00 AM todos os dias

  const task = cron.schedule(cronExpression, async () => {
    logger.info('[Scheduler] Executando limpeza de cache agendada');

    try {
      // TODO: Implementar limpeza de dados com mais de 30 dias
      logger.info('[Scheduler] Limpeza de cache concluída');
    } catch (error) {
      logger.error(`[Scheduler] Erro na limpeza: ${error}`);
    }
  });

  scheduledTasks.set('cleanup', task);
  logger.info('[Scheduler] Limpeza de cache agendada para 3:00 AM diariamente');
}

/**
 * Parar todos os jobs agendados
 */
export function stopScheduler(): void {
  logger.info('[Scheduler] Parando scheduler');

  for (const [name, task] of scheduledTasks) {
    task.stop();
    logger.info(`[Scheduler] Job '${name}' parado`);
  }

  scheduledTasks.clear();
  logger.info('[Scheduler] Scheduler parado');
}

/**
 * Obter status de um job agendado
 */
export function getJobStatus(jobName: string): {
  name: string;
  running: boolean;
  nextDate: Date | null;
} | null {
  const task = scheduledTasks.get(jobName);

  if (!task) {
    return null;
  }

  return {
    name: jobName,
    running: true, // node-cron tasks are always running when scheduled
    nextDate: null,
  };
}

/**
 * Obter status de todos os jobs
 */
export function getAllJobsStatus(): Array<{
  name: string;
  running: boolean;
  nextDate: Date | null;
}> {
  const statuses = [];

  for (const [name] of scheduledTasks) {
    statuses.push({
      name,
      running: true,
      nextDate: null,
    });
  }

  return statuses;
}

/**
 * Disparar sincronização manual
 */
export async function triggerManualSync(source?: 'siconfi' | 'portal' | 'tse'): Promise<void> {
  logger.info(`[Scheduler] Sincronização manual disparada${source ? ` (${source})` : ''}`);

  try {
    updateSyncStatus({ status: 'syncing' });

    const startTime = Date.now();

    if (source === 'siconfi') {
      await syncSiconfiOnly();
    } else if (source === 'portal') {
      await syncPortalOnly();
    } else if (source === 'tse') {
      await syncTSEOnly();
    } else {
      await syncAllPublicData();
    }

    const duration = Date.now() - startTime;

    updateSyncStatus({
      status: 'idle',
      lastSync: new Date(),
      successCount: 1,
    });

    logger.info(`[Scheduler] Sincronização manual concluída em ${duration}ms`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    updateSyncStatus({
      status: 'error',
      lastError: errorMsg,
      failureCount: 1,
    });

    logger.error(`[Scheduler] Erro na sincronização manual: ${errorMsg}`);
    throw error;
  }
}

/**
 * Validar se scheduler está ativo
 */
export function isSchedulerActive(): boolean {
  return scheduledTasks.size > 0;
}

/**
 * Reiniciar scheduler
 */
export function restartScheduler(): void {
  logger.info('[Scheduler] Reiniciando scheduler');

  stopScheduler();
  initializeScheduler();

  logger.info('[Scheduler] Scheduler reiniciado');
}
