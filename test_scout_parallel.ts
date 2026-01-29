
import { scoutAgent } from './server/agents/scout.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE DE PARALELISMO: SCOUT AGENT ---');
  try {
    await initializeDatabase();
    
    const politician = 'Jones Manoel';
    console.log(`Iniciando busca paralela para: ${politician}`);
    
    const startTime = Date.now();
    // Busca normal (não profunda) para evitar sobrecarga no teste
    const results = await scoutAgent.search(politician, false);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`\nBusca concluída em ${duration.toFixed(2)}s`);
    console.log(`Fontes encontradas: ${results?.length || 0}`);
    
    if (results && results.length > 0) {
      console.log('Amostra de fontes:', results.slice(0, 3).map(r => ({
        title: r.title,
        source: r.source,
        type: r.type
      })));
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

test();
