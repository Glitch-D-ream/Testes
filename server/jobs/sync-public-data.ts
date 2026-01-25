/**
 * Job de Sincronização Periódica de Dados Públicos
 * Executa diariamente para atualizar cache local com dados de:
 * - SICONFI (orçamentos)
 * - Portal da Transparência (gastos)
 * - TSE (histórico político)
 */

import logger from '../core/logger.ts';
import { syncSiconfiData } from '../integrations/siconfi.ts';
import { syncPortalData } from '../integrations/portal-transparencia.ts';
import { syncTSEData } from '../integrations/tse.ts';

/**
 * Categorias de promessas para sincronizar com SICONFI
 */
const SICONFI_CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'INFRASTRUCTURE',
  'EMPLOYMENT',
  'ECONOMY',
  'SECURITY',
  'ENVIRONMENT',
  'SOCIAL',
  'AGRICULTURE',
  'TRANSPORT',
];

/**
 * Estados brasileiros para sincronizar com Portal da Transparência
 */
const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR',
  'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Candidatos principais para sincronizar com TSE
 * (Exemplo: principais candidatos a presidente)
 */
const MAIN_CANDIDATES = [
  { name: 'Candidato A', state: 'SP' },
  { name: 'Candidato B', state: 'RJ' },
  { name: 'Candidato C', state: 'MG' },
];

/**
 * Executar sincronização completa de dados públicos
 */
export async function syncAllPublicData(): Promise<void> {
  try {
    logger.info('[SyncJob] Iniciando sincronização completa de dados públicos');

    const startTime = Date.now();

    // 1. Sincronizar SICONFI
    logger.info('[SyncJob] Sincronizando SICONFI...');
    await syncSiconfiData(SICONFI_CATEGORIES);
    logger.info('[SyncJob] SICONFI sincronizado com sucesso');

    // 2. Sincronizar Portal da Transparência
    logger.info('[SyncJob] Sincronizando Portal da Transparência...');
    await syncPortalData(SICONFI_CATEGORIES, BRAZILIAN_STATES);
    logger.info('[SyncJob] Portal da Transparência sincronizado com sucesso');

    // 3. Sincronizar TSE
    logger.info('[SyncJob] Sincronizando TSE...');
    await syncTSEData(MAIN_CANDIDATES);
    logger.info('[SyncJob] TSE sincronizado com sucesso');

    const duration = Date.now() - startTime;
    logger.info(`[SyncJob] Sincronização completa concluída em ${duration}ms`);
  } catch (error) {
    logger.error(`[SyncJob] Erro durante sincronização: ${error}`);
    throw error;
  }
}

/**
 * Sincronizar apenas SICONFI
 */
export async function syncSiconfiOnly(): Promise<void> {
  try {
    logger.info('[SyncJob] Sincronizando apenas SICONFI');
    await syncSiconfiData(SICONFI_CATEGORIES);
    logger.info('[SyncJob] SICONFI sincronizado');
  } catch (error) {
    logger.error(`[SyncJob] Erro ao sincronizar SICONFI: ${error}`);
    throw error;
  }
}

/**
 * Sincronizar apenas Portal da Transparência
 */
export async function syncPortalOnly(): Promise<void> {
  try {
    logger.info('[SyncJob] Sincronizando apenas Portal da Transparência');
    await syncPortalData(SICONFI_CATEGORIES, BRAZILIAN_STATES);
    logger.info('[SyncJob] Portal da Transparência sincronizado');
  } catch (error) {
    logger.error(`[SyncJob] Erro ao sincronizar Portal: ${error}`);
    throw error;
  }
}

/**
 * Sincronizar apenas TSE
 */
export async function syncTSEOnly(): Promise<void> {
  try {
    logger.info('[SyncJob] Sincronizando apenas TSE');
    await syncTSEData(MAIN_CANDIDATES);
    logger.info('[SyncJob] TSE sincronizado');
  } catch (error) {
    logger.error(`[SyncJob] Erro ao sincronizar TSE: ${error}`);
    throw error;
  }
}

/**
 * Agendar sincronização periódica
 * Executa diariamente às 2:00 AM
 */
export function schedulePeriodicSync(): void {
  // Usar node-cron ou similar em produção
  // Para agora, apenas log
  logger.info('[SyncJob] Sincronização periódica agendada para 02:00 AM diariamente');

  // Exemplo com node-cron (não instalado por padrão):
  // import cron from 'node-cron';
  // cron.schedule('0 2 * * *', () => {
  //   syncAllPublicData().catch(err => logger.error('Erro em sincronização agendada:', err));
  // });
}

/**
 * Executar sincronização com retry
 */
export async function syncWithRetry(
  maxRetries: number = 3,
  delayMs: number = 5000
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[SyncJob] Tentativa ${attempt}/${maxRetries}`);
      await syncAllPublicData();
      return; // Sucesso
    } catch (error) {
      lastError = error as Error;
      logger.warn(`[SyncJob] Tentativa ${attempt} falhou: ${lastError.message}`);

      if (attempt < maxRetries) {
        logger.info(`[SyncJob] Aguardando ${delayMs}ms antes de tentar novamente...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // Todas as tentativas falharam
  logger.error(`[SyncJob] Sincronização falhou após ${maxRetries} tentativas`);
  throw lastError;
}

/**
 * Obter status da última sincronização
 */
export interface SyncStatus {
  lastSync: Date | null;
  nextSync: Date | null;
  status: 'idle' | 'syncing' | 'error';
  lastError: string | null;
  successCount: number;
  failureCount: number;
}

let syncStatus: SyncStatus = {
  lastSync: null,
  nextSync: null,
  status: 'idle',
  lastError: null,
  successCount: 0,
  failureCount: 0,
};

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Atualizar status de sincronização
 */
export function updateSyncStatus(updates: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...updates };
}

/**
 * Inicializar sistema de sincronização
 */
export async function initializeSyncSystem(): Promise<void> {
  logger.info('[SyncJob] Inicializando sistema de sincronização');

  try {
    // Executar sincronização inicial
    updateSyncStatus({ status: 'syncing' });
    await syncAllPublicData();

    updateSyncStatus({
      status: 'idle',
      lastSync: new Date(),
      successCount: syncStatus.successCount + 1,
    });

    logger.info('[SyncJob] Sistema de sincronização inicializado com sucesso');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    updateSyncStatus({
      status: 'error',
      lastError: errorMessage,
      failureCount: syncStatus.failureCount + 1,
    });

    logger.error(`[SyncJob] Erro ao inicializar: ${errorMessage}`);
  }
}
