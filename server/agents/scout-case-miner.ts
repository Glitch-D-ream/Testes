
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { huggingFaceService } from '../services/ai-huggingface.service.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { ingestionService } from '../services/ingestion.service.ts';

export interface CaseEvidence {
  title: string;
  url: string;
  content: string;
  summary: string;
  entities: any[];
  quotes: string[];
  publishedAt?: string;
  source: string;
}

/**
 * ScoutCaseMiner v3.3 - PERFORMANCE OPTIMIZED
 * Foco em velocidade e extração direta de evidências críticas.
 */
export class ScoutCaseMiner {
  private readonly MAX_URLS = 3; // Reduzido de 5 para 3 para maior velocidade
  private readonly INGESTION_TIMEOUT = 25000; // 25s por URL

  async mine(politicianName: string): Promise<CaseEvidence[]> {
    logInfo(`[CaseMiner] 🔍 Iniciando mineração ultra-rápida para: ${politicianName}`);
    
    const queries = [
      `${politicianName} declarações polêmicas`,
      `${politicianName} investigação processo judicial`
    ];

    const allUrls = new Set<string>();
    try {
      // Busca paralela de URLs
      const searchPromises = queries.map(q => directSearchImproved.search(q, false).catch(() => []));
      const searchResults = await Promise.all(searchPromises);
      searchResults.flat().forEach(r => {
        if (r.url && !r.url.includes('wikipedia.org')) allUrls.add(r.url);
      });
    } catch (e) {
      logError(new Error(`[CaseMiner] Falha na busca inicial de URLs`));
    }

    const targetUrls = Array.from(allUrls).slice(0, this.MAX_URLS);
    logInfo(`[CaseMiner] ${targetUrls.length} URLs selecionadas para análise profunda.`);

    const evidences: CaseEvidence[] = [];

    // Processamento em paralelo com limites de tempo individuais
    const processPromises = targetUrls.map(async (url) => {
      try {
        logInfo(`[CaseMiner] Processando: ${new URL(url).hostname}`);
        
        // Timeout forçado para a ingestão
        const contentResult = await Promise.race([
          ingestionService.ingest(url),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout de Ingestão')), this.INGESTION_TIMEOUT))
        ]).catch(() => null);

        if (!contentResult || contentResult.content.length < 400) return null;

        const content = contentResult.content;
        
        // Processamento de IA ultra-rápido ou fallback
        const [summary, entities] = await Promise.all([
          huggingFaceService.summarize(content).catch(() => content.substring(0, 500)),
          huggingFaceService.extractEntities(content.substring(0, 1000)).catch(() => [])
        ]);

        const quotes = huggingFaceService.extractQuotes(content);

        return {
          title: `Evidência: ${new URL(url).hostname}`,
          url,
          content: content.substring(0, 3000),
          summary,
          entities,
          quotes: quotes.slice(0, 5),
          source: new URL(url).hostname
        };

      } catch (error: any) {
        logWarn(`[CaseMiner] Falha em ${url}: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(processPromises);
    results.forEach(res => { if (res) evidences.push(res); });

    logInfo(`[CaseMiner] Finalizado. ${evidences.length} evidências extraídas.`);
    return evidences;
  }
}

export const scoutCaseMiner = new ScoutCaseMiner();
