
import { BrainAgent } from '../agents/brain.ts';
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function runAnalysis() {
  logInfo('🚀 Iniciando script de análise para Nikolas Ferreira...');

  try {
    // 1. Inicializar banco de dados
    await initializeDatabase();

    // 2. Instanciar o BrainAgent
    const brain = new BrainAgent();

    // 3. Executar análise
    logInfo('🔍 Executando análise profunda (isso pode levar alguns minutos)...');
    const result = await brain.analyze('Nikolas Ferreira');

    logInfo('✅ Análise concluída com sucesso!');
    logInfo('--- RESULTADO DA ANÁLISE ---');
    logInfo(JSON.stringify(result, null, 2));
    logInfo('---------------------------');

    process.exit(0);
  } catch (error) {
    logError('❌ Erro fatal durante a análise:', error as Error);
    process.exit(1);
  }
}

runAnalysis();
