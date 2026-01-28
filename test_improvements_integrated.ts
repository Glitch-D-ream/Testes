
import * as dotenv from 'dotenv';
dotenv.config();

import { brainAgentV4Enhanced } from './server/agents/brain-v4-enhanced.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function testImprovedSystem() {
  logInfo('🚀 Teste Integrado: Seth VII v3.3 com Melhorias Estruturais');
  logInfo('Alvo: Arthur Lira');
  logInfo('Melhorias: Scout Otimizado + Consensus Validator + Adversarial Learning');
  
  const startTime = Date.now();

  try {
    const report = await brainAgentV4Enhanced.analyze('Arthur Lira');
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n========== RELATÓRIO FINAL ==========');
    console.log(`Alvo: ${report.targetName}`);
    console.log(`Credibilidade: ${report.credibilityScore}%`);
    console.log(`Consenso entre Modelos: ${report.consensusScore}%`);
    console.log(`Tempo Total: ${duration.toFixed(2)}s`);
    console.log(`\nVeredito:`, JSON.stringify(report.verdict, null, 2));
    console.log(`\nLinhagem de Dados:`);
    report.dataLineage.forEach(line => console.log(`  - ${line}`));
    console.log(`\nInsights Adversariais Anteriores: ${report.adversarialInsights.length}`);
    console.log('=====================================\n');
    
    process.exit(0);
  } catch (error) {
    logError('❌ Erro no teste integrado:', error as Error);
    process.exit(1);
  }
}

testImprovedSystem();
