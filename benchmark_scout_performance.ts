
import { scoutAgent } from './server/agents/scout.ts';
import { initializeDatabase } from './server/core/database.ts';
import { IntelligentCache } from './server/core/intelligent-cache.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function benchmark() {
  console.log('--- BENCHMARK DE PERFORMANCE: SCOUT AGENT (v2.7) ---');
  try {
    await initializeDatabase();
    
    // Limpar cache L1 para teste justo
    IntelligentCache.clearL1();
    
    const politician = 'Jones Manoel';
    console.log(`Iniciando busca paralela otimizada para: ${politician}`);
    
    const startTime = Date.now();
    const results = await scoutAgent.search(politician, true);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n--- RESULTADOS ---');
    console.log(`Tempo total: ${duration.toFixed(2)}s`);
    console.log(`Fontes encontradas: ${results?.length || 0}`);
    
    if (results && results.length > 0) {
      const types = results.reduce((acc: any, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});
      console.log('Distribuição por tipo:', types);
    }

    // Testar efeito do cache
    console.log('\nTestando busca com cache (L3)...');
    const cacheStartTime = Date.now();
    await scoutAgent.search(politician, true);
    const cacheDuration = (Date.now() - cacheStartTime) / 1000;
    console.log(`Tempo com cache: ${cacheDuration.toFixed(2)}s`);

  } catch (error) {
    console.error('Erro no benchmark:', error);
  }
}

benchmark();
