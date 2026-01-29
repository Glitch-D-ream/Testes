
import { ingestionService } from './server/services/ingestion.service.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE DE CACHE: INGESTION SERVICE ---');
  try {
    await initializeDatabase();
    
    const url = 'https://pt.wikipedia.org/wiki/Erika_Hilton';
    
    console.log(`\n1. Primeira ingestão (sem cache)...`);
    const start1 = Date.now();
    await ingestionService.ingest(url);
    console.log(`Tempo 1: ${Date.now() - start1}ms`);
    
    console.log(`\n2. Segunda ingestão (deve usar cache)...`);
    const start2 = Date.now();
    const result = await ingestionService.ingest(url);
    const duration2 = Date.now() - start2;
    console.log(`Tempo 2: ${duration2}ms`);
    
    if (duration2 < 500) {
      console.log('\n✅ SUCESSO: Cache de conteúdo funcionando!');
    } else {
      console.log('\n❌ FALHA: Cache de conteúdo não reduziu o tempo significativamente.');
    }

  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

test();
