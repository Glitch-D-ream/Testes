
import * as dotenv from 'dotenv';
dotenv.config();

import { brainAgentV4Integrated } from './server/agents/brain-v4-integrated.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function testBrainV4Integrated() {
  logInfo('🧠 TESTE FINAL: Brain v4 Integrated com Arthur Lira');
  logInfo('═══════════════════════════════════════════════════');
  
  const startTime = Date.now();

  try {
    const report = await brainAgentV4Integrated.analyze('Arthur Lira');
    
    const duration = report.processingTimeMs;
    
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           RELATÓRIO FINAL - SETH VII v4 INTEGRATED         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📋 ALVO: ${report.targetName}`);
    console.log(`📊 CARGO: ${report.profile?.office || 'N/A'} | PARTIDO: ${report.profile?.party || 'N/A'}`);
    console.log(`\n🎯 MÉTRICAS:`);
    console.log(`   • Credibilidade: ${report.credibilityScore}%`);
    console.log(`   • Consenso entre Modelos: ${report.consensusScore}%`);
    console.log(`   • Tempo Total: ${(duration / 1000).toFixed(2)}s`);
    
    console.log(`\n📑 VEREDITO TÉCNICO:`);
    console.log(JSON.stringify(report.verdict, null, 2));
    
    console.log(`\n🔍 RELATÓRIOS ESPECIALIZADOS:`);
    console.log(`   • Assiduidade: ${report.specialistReports.absence?.absences?.length || 0} faltas`);
    console.log(`   • Vulnerabilidades: ${report.specialistReports.vulnerability?.evidences?.length || 0} vetores`);
    console.log(`   • Emendas/PIX: ${report.specialistReports.finance?.length || 0} registros`);
    console.log(`   • Contradições: ${report.specialistReports.coherence?.contradictions?.length || 0} inconsistências`);
    
    console.log(`\n📊 LINHAGEM DE DADOS:`);
    report.dataLineage.forEach((line: string) => console.log(`   ✓ ${line}`));
    
    console.log(`\n💾 INSIGHTS ADVERSARIAIS ANTERIORES: ${report.adversarialInsights.length}`);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ ANÁLISE CONCLUÍDA                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
  } catch (error) {
    logError('❌ Erro no teste integrado:', error as Error);
    console.error('\n❌ FALHA NA ANÁLISE');
    process.exit(1);
  }
}

testBrainV4Integrated();
