
import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE DE LÓGICA DO BRAIN AGENT (ERIKA HILTON) ---');
  try {
    await initializeDatabase();
    
    // Simular entrada para o Brain (evitando o Scout real se ele travar)
    // Mas vamos tentar rodar o analyze direto primeiro, pois ele deve usar o cache que criamos
    console.log('Iniciando análise (deve usar cache de ingestão)...');
    
    const startTime = Date.now();
    const result = await brainAgent.analyze('Erika Hilton');
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`\nAnálise concluída em ${duration.toFixed(2)}s`);
    console.log(`Veredito: ${result.coherenceAnalysis.overallScore}/100`);
    console.log('\nRelatório Humanizado (Início):');
    console.log(result.humanizedReport.substring(0, 500));

  } catch (error) {
    console.error('Erro no teste de lógica:', error);
  }
}

test();
