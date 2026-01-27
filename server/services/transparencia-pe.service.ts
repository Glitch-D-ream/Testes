
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';

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
    
    // Tentativa 1: Busca Direta no Portal
    const searchUrl = `${this.baseUrl}/busca?q=${encodeURIComponent(query)}`;
    
    try {
      const content = await browserScraper.scrape(searchUrl);
      
      if (content && content.length > 500) {
        logInfo(`[TransparenciaPE] Sucesso na extração direta do portal.`);
        return [{
          title: `Portal da Transparência PE - Resultados para ${query}`,
          url: searchUrl,
          description: content.substring(0, 200) + '...',
          date: new Date().toISOString()
        }];
      }

      // Tentativa 2: Scraping de Última Instância (Busca via Google Dorking para achar PDFs no domínio)
      logWarn(`[TransparenciaPE] Portal bloqueado ou vazio. Ativando Scraping de Última Instância...`);
      const dorkUrl = `https://www.google.com/search?q=site:transparencia.pe.gov.br+"${query}"+filetype:pdf`;
      const dorkContent = await browserScraper.scrape(dorkUrl);
      
      if (dorkContent && dorkContent.includes('http')) {
        logInfo(`[TransparenciaPE] Encontrados documentos via Dorking.`);
        return [{
          title: `Documentos Públicos PE (via Dorking) - ${query}`,
          url: dorkUrl,
          description: 'Documentos e PDFs encontrados diretamente no domínio do Estado de Pernambuco.',
          date: new Date().toISOString()
        }];
      }

      return [];
    } catch (error: any) {
      logError(`[TransparenciaPE] Falha total na busca regional: ${error.message}`);
      return [];
    }
  }
}

export const transparenciaPEService = new TransparenciaPEService();
