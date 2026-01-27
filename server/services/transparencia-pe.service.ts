
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';
import { ingestionService } from './ingestion.service.ts';

export interface TransparenciaItem {
  title: string;
  url: string;
  description: string;
  date?: string;
}

export class TransparenciaPEService {
  private baseUrl = 'https://www.transparencia.pe.gov.br';

  async search(query: string): Promise<TransparenciaItem[]> {
    logInfo(`[TransparenciaPE] Iniciando busca regional (Pernambuco) para: ${query}`);
    
    // Portal da Transparência de PE
    const searchUrl = `${this.baseUrl}/busca?q=${encodeURIComponent(query)}`;
    
    try {
      // Usar timeout curto para não travar o fluxo principal
      const results = await Promise.race([
        browserScraper.scrape(searchUrl),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 10000))
      ]);

      if (!results) {
        logWarn(`[TransparenciaPE] Busca regional em PE demorou muito ou falhou.`);
        return [];
      }

      return [{
        title: `Portal da Transparência PE - Resultados para ${query}`,
        url: searchUrl,
        description: `Dados de empenhos, contratos e repasses do Estado de Pernambuco relacionados a ${query}.`,
        date: new Date().toISOString()
      }];
    } catch (error: any) {
      logError(`[TransparenciaPE] Erro na busca regional: ${error.message}`);
      return [];
    }
  }
}

export const transparenciaPEService = new TransparenciaPEService();
