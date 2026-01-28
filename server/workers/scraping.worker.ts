import { Job } from 'bull';
import { logInfo, logError } from '../core/logger.ts';
import { scoutAgent } from '../agents/scout.ts';

/**
 * Worker para a fila de scraping
 */
export default async function scrapingWorker(job: Job): Promise<any> {
  const { politicianName, analysisId } = job.data;
  logInfo(`[ScrapingWorker] Processando job ${job.id} para: ${politicianName}`);

  try {
    // A lógica de scraping que estava no modo síncrono do QueueManager
    const results = await scoutAgent.search(politicianName, true);
    logInfo(`[ScrapingWorker] Job ${job.id} concluído. ${results.length} fontes encontradas.`);
    
    // TODO: Adicionar o resultado à próxima fila (processingQueue)
    
    return { success: true, sources: results.length };
  } catch (error) {
    logError(`[ScrapingWorker] Erro no job ${job.id} para ${politicianName}`, error as Error);
    throw error; // Lança o erro para o BullMQ tentar novamente
  }
}
