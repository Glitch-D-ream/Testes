
import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase } from './server/core/database.ts';
import { logInfo, logError } from './server/core/logger.ts';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function runFullTest() {
  console.log('--- TESTE COMPLETO DO SISTEMA SETH VII ---');
  console.log('Alvo: Erika Hilton');
  
  try {
    // 1. Inicializar DB
    await initializeDatabase();
    
    const startTime = Date.now();
    
    // 2. Executar análise completa (Fase 1 a 4)
    // Nota: O BrainAgent já orquestra Scout, Filter, Coerência e Humanização
    console.log('\n🧠 Iniciando Brain Agent v6.0 (Análise Multidimensional)...');
    const result = await brainAgent.analyze('Erika Hilton');
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n✅ Análise concluída com sucesso!');
    console.log(`Tempo total de processamento: ${duration.toFixed(2)}s`);
    
    // 3. Salvar resultado em arquivo para inspeção
    const reportPath = './full_analysis_erika_hilton.json';
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
    
    console.log(`\n--- RESUMO DO RELATÓRIO ---`);
    console.log(`Político: ${result.politicianName} (${result.politician.party}-${result.politician.state})`);
    console.log(`Promessas extraídas: ${result.promises.total}`);
    console.log(`Score de Coerência: ${result.coherenceAnalysis.overallScore}/100`);
    console.log(`Score de Consenso: ${result.consensusMetrics.consensusScore}/100`);
    
    console.log('\n--- VEREDITO HUMANIZADO (PREVIEW) ---');
    console.log(result.humanizedReport.substring(0, 500) + '...');

    // 4. Salvar o relatório humanizado em Markdown
    fs.writeFileSync('./RELATORIO_FINAL_ERIKA_HILTON.md', result.humanizedReport);
    console.log(`\n📄 Relatório Markdown salvo em: ./RELATORIO_FINAL_ERIKA_HILTON.md`);

  } catch (error) {
    logError('Erro fatal no teste completo:', error as Error);
    console.error('Falha no teste. Verifique os logs.');
  }
}

runFullTest();
