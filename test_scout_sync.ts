import { scoutAgent } from './server/agents/scout.ts';
import { initializeDatabase } from './server/core/database.ts';
import { logInfo, logError } from './server/core/logger.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE SCOUT AGENT (SÍNCRONO) ---');
  try {
    await initializeDatabase();
    console.log('Iniciando busca para: Erika Hilton');
    const startTime = Date.now();
    
    // Testar busca síncrona
    const results = await scoutAgent.search('Erika Hilton', true);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Busca concluída em ${duration}s`);
    console.log(`Resultados encontrados: ${results?.length || 0}`);
    
    if (results && results.length > 0) {
      console.log('Amostra do primeiro resultado:', {
        title: results[0].title,
        source: results[0].source,
        url: results[0].url
      });
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

test();
