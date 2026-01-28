
import * as dotenv from 'dotenv';
dotenv.config();

import { brainAgentV4Integrated } from './server/agents/brain-v4-integrated.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function testHumanizedDossier() {
  logInfo('🧪 TESTE v4.1: Dossiê Humanizado e Profundo');
  logInfo('Alvo: Arthur Lira');
  
  try {
    const report = await brainAgentV4Integrated.analyze('Arthur Lira');
    
    console.log('\n========================================================');
    console.log('              RELATÓRIO HUMANIZADO (v4.1)              ');
    console.log('========================================================\n');
    console.log(report.humanizedReport);
    console.log('\n========================================================');
    console.log(`\n✓ Tempo de Processamento: ${(report.processingTimeMs / 1000).toFixed(2)}s`);
    console.log(`✓ Consenso de IA: ${report.consensusScore}%`);
    console.log(`✓ Fontes Sociais Mineradas: ${report.specialistReports.social?.length || 0}`);
    
    process.exit(0);
  } catch (error) {
    logError('❌ Erro no teste humanizado:', error as Error);
    process.exit(1);
  }
}

testHumanizedDossier();
