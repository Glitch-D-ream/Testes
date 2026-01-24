import { scoutAgent } from '../server/agents/scout.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function debugSearch() {
  const name = 'Nikolas Ferreira';
  console.log(`--- Iniciando Debug de Busca para: ${name} ---`);
  
  try {
    console.log('Chamando scoutAgent.search...');
    const results = await scoutAgent.search(name);
    
    console.log(`\nBusca finalizada. Total de resultados: ${results.length}`);
    
    if (results.length > 0) {
      results.forEach((r, i) => {
        console.log(`[${i+1}] ${r.title} (${r.source})`);
        console.log(`    URL: ${r.url}`);
      });
    } else {
      console.log('\n❌ NENHUM RESULTADO ENCONTRADO.');
      console.log('Isso explica por que a análise falha para nomes novos.');
    }
  } catch (error) {
    console.error('\n❌ ERRO FATAL NA BUSCA:', error);
  }
}

debugSearch();
