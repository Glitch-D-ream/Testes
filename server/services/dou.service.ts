
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { ingestionService } from './ingestion.service.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';

export interface DOUAct {
  title: string;
  url: string;
  content: string;
  date: string;
  type: string;
}

export class DOUService {
  /**
   * Busca atos oficiais no DOU relacionados a um político ou tema
   */
  async searchActs(query: string): Promise<DOUAct[]> {
    logInfo(`[DOUService] Buscando atos no DOU para: ${query}`);
    
    // O DOU publica no in.gov.br. Vamos focar em buscas que retornem PDFs ou páginas de atos.
    // Usando uma query que inclua o termo "Diário Oficial da União" para maior compatibilidade com buscadores
    const douQuery = `"${query}" "Diário Oficial da União"`;
    
    try {
      const searchResults = await directSearchImproved.search(douQuery);
      logInfo(`[DOUService] Encontrados ${searchResults.length} resultados potenciais no DOU.`);

      const acts: DOUAct[] = [];
      
      // Processar os top 5 resultados para evitar sobrecarga
      for (const result of searchResults.slice(0, 5)) {
        try {
          const ingestion = await ingestionService.ingest(result.url);
          if (ingestion && ingestion.content.length > 100) {
            acts.push({
              title: result.title,
              url: result.url,
              content: ingestion.content,
              date: ingestion.metadata.date || new Date().toISOString(),
              type: ingestion.format === 'pdf' ? 'PDF Oficial' : 'Página Oficial'
            });
          }
        } catch (err) {
          logWarn(`[DOUService] Falha ao processar ato ${result.url}: ${err}`);
        }
      }

      return acts;
    } catch (error: any) {
      logError(`[DOUService] Erro na busca do DOU: ${error.message}`);
      return [];
    }
  }
}

export const douService = new DOUService();
