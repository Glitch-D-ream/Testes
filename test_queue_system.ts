
import { scrapingQueue } from './server/queues/index.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function testQueue() {
  logInfo('🧪 Testando Sistema de Filas...');
  
  try {
    const job = await scrapingQueue.add({
      politicianName: 'Teste Fila',
      sourceType: 'TEST',
      timestamp: new Date().toISOString()
    });
    
    logInfo(`✅ Job de teste adicionado com ID: ${job.id}`);
    
    const count = await scrapingQueue.count();
    logInfo(`📊 Total de jobs na fila de scraping: ${count}`);
    
    process.exit(0);
  } catch (error) {
    logError('❌ Erro no teste de fila:', error as Error);
    process.exit(1);
  }
}

testQueue();
