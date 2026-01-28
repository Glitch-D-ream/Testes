
import * as dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from './server/core/database.ts';
import { brainAgent } from './server/agents/brain.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function runTest() {
  logInfo('🚀 Iniciando Teste de Auditoria Forense: Arthur Lira');
  
  try {
    // 1. Inicializar Banco (Supabase)
    await initializeDatabase();
    
    // 2. Executar o BrainAgent (que orquestra Scout, Filter, Vulnerability, etc.)
    // Passamos null para userId para simular uma análise anônima/sistema
    logInfo('🧠 Chamando BrainAgent...');
    const result = await brainAgent.analyze('Arthur Lira', null);
    
    logInfo('✅ Análise concluída com sucesso!');
    console.log('\n--- RESULTADO DA AUDITORIA ---');
    console.log('Político:', result.politicianName);
    console.log('Cargo:', result.politician.office);
    console.log('Partido:', result.politician.party);
    console.log('Consenso (Fontes):', result.consensusMetrics.verifiedCount);
    console.log('Linhagem de Dados:', JSON.stringify(result.dataLineage, null, 2));
    
    process.exit(0);
  } catch (error) {
    logError('❌ Falha crítica no teste de auditoria:', error as Error);
    process.exit(1);
  }
}

runTest();
