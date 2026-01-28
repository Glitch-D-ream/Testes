
import { scoutCaseMiner } from '../agents/scout-case-miner.ts';
import { logInfo, logError } from '../core/logger.ts';
import dotenv from 'dotenv';
dotenv.config();

async function testCaseMiner() {
  logInfo('🚀 Testando Scout Case Miner v3.2...');

  const target = 'Nikolas Ferreira';

  try {
    const evidences = await scoutCaseMiner.mine(target);
    
    console.log('\n--- RESULTADOS DA MINERAÇÃO ---');
    console.log(`Total de evidências: ${evidences.length}`);
    
    evidences.forEach((ev, i) => {
      console.log(`\n[${i+1}] ${ev.title}`);
      console.log(`URL: ${ev.url}`);
      console.log(`Resumo: ${ev.summary.substring(0, 200)}...`);
      console.log(`Citações Detectadas: ${ev.quotes.length}`);
      if (ev.quotes.length > 0) {
        console.log(`Exemplo de Citação: "${ev.quotes[0]}"`);
      }
    });

    if (evidences.length > 0) {
      logInfo('✅ Sucesso: O Case Miner conseguiu extrair e processar evidências profundas.');
    } else {
      logWarn('⚠️ Aviso: Nenhuma evidência encontrada. Verifique a conexão ou as queries.');
    }

  } catch (error: any) {
    logError(`❌ Falha no teste do Case Miner: ${error.message}`);
  }
}

testCaseMiner();
