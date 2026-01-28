
import * as dotenv from 'dotenv';
dotenv.config();

import { brainAgentV4Integrated } from './server/agents/brain-v4-integrated.ts';
import { logInfo, logError } from './server/core/logger.ts';
import * as fs from 'fs';

async function testErikaHilton() {
  logInfo('🧪 TESTE v4.1: Análise Profunda - Erika Hilton');
  
  try {
    const report = await brainAgentV4Integrated.analyze('Erika Hilton');
    
    const dossierPath = '/home/ubuntu/DOSSIE_ERIKA_HILTON_V4_1.md';
    fs.writeFileSync(dossierPath, report.humanizedReport);
    
    console.log('\n✅ Dossiê gerado com sucesso em: ' + dossierPath);
    console.log(`✓ Tempo: ${(report.processingTimeMs / 1000).toFixed(2)}s`);
    console.log(`✓ Consenso: ${report.consensusScore}%`);
    
    process.exit(0);
  } catch (error) {
    logError('❌ Erro na análise da Erika Hilton:', error as Error);
    process.exit(1);
  }
}

testErikaHilton();
