
import { scrapingQueue } from '../queues/index.ts';
import { logInfo, logError, logWarn } from './logger.ts';
import { scoutAgent } from '../agents/scout.ts';
import { supabase } from './supabase.ts';

/**
 * Gerenciador de Filas com Fallback e Proteção de Timeout
 * v3.4 - Focado em eliminar o "carregamento infinito"
 */
export class QueueManager {
  private static useQueues = process.env.USE_QUEUES === 'true';
  private static fallbackMode = false;
  private static MAX_SYNC_TIMEOUT = 45000; // 45 segundos para resposta síncrona

  /**
   * Despacha um job de scraping com proteção contra travamento
   */
  static async dispatchScrapingJob(politicianName: string, sourceType: string = 'SEARCH_HYBRID', analysisId?: string) {
    if (this.useQueues && !this.fallbackMode) {
      try {
        logInfo(`[QueueManager] Despachando job para fila: ${politicianName}`);
        
        // Atualiza status no Supabase para 'processing' se houver ID
        if (analysisId) {
          await supabase.from('analyses').update({ status: 'processing', progress: 10 }).eq('id', analysisId);
        }

        return await scrapingQueue.add({
          politicianName,
          sourceType,
          analysisId,
          timestamp: new Date().toISOString()
        }, {
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
          timeout: 120000 // Timeout do job na fila (2 min)
        });
      } catch (error) {
        logError(`[QueueManager] Falha na fila, ativando fallback para ${politicianName}`, error as Error);
        this.activateFallback();
        return await this.safeLegacyExecution(politicianName, analysisId);
      }
    } else {
      logInfo(`[QueueManager] Executando em modo síncrono: ${politicianName}`);
      return await this.safeLegacyExecution(politicianName, analysisId);
    }
  }

  /**
   * Execução síncrona protegida por timeout
   */
  private static async safeLegacyExecution(name: string, analysisId?: string) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(async () => {
        logWarn(`[QueueManager] Timeout síncrono atingido para ${name}. Retornando erro parcial.`);
        if (analysisId) {
          await supabase.from('analyses').update({ 
            status: 'failed', 
            error_message: 'Timeout no processamento síncrono' 
          }).eq('id', analysisId);
        }
        reject(new Error('TIMEOUT_SYNC'));
      }, this.MAX_SYNC_TIMEOUT);

      try {
        const result = await scoutAgent.search(name, true);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        logError(`[QueueManager] Erro na execução síncrona para ${name}:`, error as Error);
        reject(error);
      }
    });
  }

  private static activateFallback() {
    this.fallbackMode = true;
    logWarn('[QueueManager] MODO FALLBACK ATIVADO.');
    setTimeout(() => { this.fallbackMode = false; }, 5 * 60 * 1000);
  }
}
