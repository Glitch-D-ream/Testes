
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

// Importar os workers para registrá-los
import '../queues/scraping-worker.ts';
// Futuramente importar outros workers aqui:
// import '../queues/processing-worker.ts';
// import '../queues/analysis-worker.ts';

async function startWorkers() {
  logInfo('⚙️ Iniciando Processadores de Fila (Workers)...');
  
  try {
    await initializeDatabase();
    logInfo('✅ Conexão com banco estabelecida para os workers.');
    
    // O processo deve continuar rodando para escutar as filas
    logInfo('🚀 Workers em execução. Pressione Ctrl+C para parar.');
  } catch (error) {
    logError('Falha ao iniciar workers:', error as Error);
    process.exit(1);
  }
}

startWorkers();
