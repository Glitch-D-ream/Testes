
import { initializeDatabase, getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Cleanup Worker
 * Este script é projetado para rodar no GitHub Actions para limpar dados antigos via Supabase RPC.
 */
async function runCleanupWorker() {
  logInfo('🚀 Iniciando Cleanup Worker Independente...');

  try {
    // 1. Inicializar Banco de Dados
    await initializeDatabase();
    const supabase = getSupabase();

    // 2. Executar Cleanup via RPC
    logInfo('[CleanupWorker] Chamando cleanup_old_data no Supabase...');
    const { error: rpcError } = await supabase.rpc('cleanup_old_data');
    
    if (rpcError) {
      throw new Error(`Erro ao executar cleanup_old_data: ${rpcError.message}`);
    }

    logInfo('✅ Cleanup Worker concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logError('❌ Falha crítica no Cleanup Worker:', error as Error);
    process.exit(1);
  }
}

// Executar o worker
runCleanupWorker();
