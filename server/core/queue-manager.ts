
import { scrapingQueue } from '../queues/index.ts';
import { logInfo, logError } from './logger.ts';
import { scoutAgent } from '../agents/scout.ts';

/**
 * Gerenciador de Filas com Fallback
 * Permite alternar entre processamento em fila (Bull) e síncrono (Legacy)
 */
export class QueueManager {
  private static useQueues = process.env.USE_QUEUES === 'true';
  private static fallbackMode = false;

  /**
   * Despacha um job de scraping
   */
  static async dispatchScrapingJob(politicianName: string, sourceType: string = 'SEARCH_HYBRID') {
    if (this.useQueues && !this.fallbackMode) {
      try {
        logInfo(`[QueueManager] Despachando job para fila: ${politicianName}`);
        return await scrapingQueue.add({
          politicianName,
          sourceType,
          timestamp: new Date().toISOString()
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 }
        });
      } catch (error) {
        logError(`[QueueManager] Falha ao adicionar na fila, ativando fallback síncrono para ${politicianName}`, error as Error);
        this.activateFallback();
        return await this.legacyScoutExecution(politicianName);
      }
    } else {
      logInfo(`[QueueManager] Executando em modo síncrono (Fallback: ${this.fallbackMode}): ${politicianName}`);
      return await this.legacyScoutExecution(politicianName);
    }
  }

  /**
   * Execução síncrona (Legacy) para quando as filas estão desativadas ou falham
   */
  private static async legacyScoutExecution(name: string) {
    try {
      return await scoutAgent.search(name, true);
    } catch (error) {
      logError(`[QueueManager] Erro na execução legacy para ${name}:`, error as Error);
      throw error;
    }
  }

  /**
   * Ativa o modo de fallback temporário
   */
  private static activateFallback() {
    this.fallbackMode = true;
    logInfo('[QueueManager] MODO FALLBACK ATIVADO. As próximas tarefas serão síncronas.');
    
    // Tenta desativar o fallback após 5 minutos
    setTimeout(() => {
      this.fallbackMode = false;
      logInfo('[QueueManager] Tentando desativar modo fallback...');
    }, 5 * 60 * 1000);
  }

  /**
   * Altera o estado do feature toggle em tempo real (se necessário)
   */
  static setUseQueues(value: boolean) {
    this.useQueues = value;
    logInfo(`[QueueManager] Feature toggle 'useQueues' alterado para: ${value}`);
  }
}
