
import { syncAllPublicData, updateSyncStatus } from '../jobs/sync-public-data.ts';
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Data Sync Worker
 * Este script é projetado para rodar no GitHub Actions para sincronizar dados do SICONFI, Portal da Transparência e TSE.
 */
async function runSyncWorker() {
  logInfo('🚀 Iniciando Data Sync Worker Independente...');

  try {
    // 1. Inicializar Banco de Dados
    await initializeDatabase();

    // 2. Executar Sincronização
    logInfo('[SyncWorker] Iniciando sincronização de dados públicos...');
    
    updateSyncStatus({ status: 'syncing' });
    const startTime = Date.now();
    
    await syncAllPublicData();
    
    const duration = Date.now() - startTime;
    updateSyncStatus({
      status: 'idle',
      lastSync: new Date(),
      successCount: 1,
    });

    logInfo(`✅ Data Sync Worker concluído com sucesso em ${duration}ms!`);
    process.exit(0);
  } catch (error) {
    logError('❌ Falha crítica no Data Sync Worker:', error as Error);
    
    updateSyncStatus({
      status: 'error',
      lastError: (error as Error).message,
      failureCount: 1,
    });
    
    process.exit(1);
  }
}

// Executar o worker
runSyncWorker();
