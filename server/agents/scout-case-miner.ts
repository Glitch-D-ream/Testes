
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

export class ScoutCaseMiner {
  /**
   * Realiza uma mineração profunda de casos, entrevistas e notícias
   */
  async mine(politicianName: string): Promise<CaseEvidence[]> {
    logInfo(`[CaseMiner] Iniciando mineração profunda para: ${politicianName}`);
    
    // 1. Buscar URLs relevantes focadas em entrevistas e polêmicas
    const queries = [
      `${politicianName} entrevista exclusiva`,
      `${politicianName} declarações polêmicas`,
      `${politicianName} processo judicial notícias`,
      `${politicianName} investigação Ministério Público`
    ];

    const allUrls = new Set<string>();
    for (const query of queries) {
      const results = await directSearchImproved.search(query, false);
      results.forEach(r => allUrls.add(r.url));
    }

    const targetUrls = Array.from(allUrls).slice(0, 5); // Limitar a 5 fontes de alta densidade
    logInfo(`[CaseMiner] ${targetUrls.length} URLs candidatas encontradas.`);

    const evidences: CaseEvidence[] = [];

    for (const url of targetUrls) {
      try {
        logInfo(`[CaseMiner] Extraindo conteúdo de: ${url}`);
        
        // Usar o IngestionService que já lida com redirecionamentos e extração robusta
        const content = await ingestionService.ingest(url);

        if (!content || content.length < 500) {
          logWarn(`[CaseMiner] Conteúdo insuficiente em ${url}, pulando.`);
          continue;
        }

        // 2. Processar com HuggingFace (Sumarização, NER e Quotes)
        const summary = await huggingFaceService.summarize(content);
        const entities = await huggingFaceService.extractEntities(summary);
        const quotes = huggingFaceService.extractQuotes(content);

        evidences.push({
          title: `Evidência de ${new URL(url).hostname}`,
          url,
          content: content.substring(0, 5000), // Limitar para não estourar memória
          summary,
          entities,
          quotes,
          source: new URL(url).hostname
        });

      } catch (error: any) {
        logError(`[CaseMiner] Erro ao processar ${url}: ${error.message}`);
      }
    }
    logInfo(`[CaseMiner] Mineração concluída. ${evidences.length} evidências sólidas encontradas.`);
    return evidences;
  }
}

export const scoutCaseMiner = new ScoutCaseMiner();
