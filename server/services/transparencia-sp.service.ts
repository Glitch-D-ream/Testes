
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';
import { ingestionService } from './ingestion.service.ts';

export interface TransparenciaItem {
  title: string;
  url: string;
  description: string;
  date?: string;
}

export class TransparenciaSPService {
  private baseUrl = 'https://www.transparencia.sp.gov.br';

  /**
   * Busca dados no Portal da Transparência de SP relacionados a um termo
   */
  async search(query: string): Promise<TransparenciaItem[]> {
    logInfo(`[TransparenciaSP] Iniciando busca para: ${query}`);
    
    // O Portal da Transparência de SP usa URLs estruturadas para busca.
    // Vamos usar o scraper para navegar e extrair os links de resultados.
    const searchUrl = `${this.baseUrl}/Pesquisa?q=${encodeURIComponent(query)}`;
    
    try {
      const htmlContent = await browserScraper.scrape(searchUrl);
      if (!htmlContent) {
        logWarn(`[TransparenciaSP] Nenhum conteúdo retornado para a busca: ${query}`);
        return [];
      }

      // Como o scraper já limpa o HTML e retorna texto, para uma busca mais precisa
      // poderíamos precisar de seletores específicos. Mas para este MVP, 
      // vamos simular a extração de links relevantes baseados no texto.
      
      logInfo(`[TransparenciaSP] Processando resultados da busca.`);
      
      // Simulando a descoberta de links (em uma implementação real, usaríamos o page.evaluate do scraper)
      // Por agora, vamos retornar uma estrutura que o Scout possa usar para aprofundar.
      
      return [{
        title: `Resultados da Transparência SP para ${query}`,
        url: searchUrl,
        description: 'Página consolidada de resultados do Portal da Transparência do Estado de São Paulo.',
        date: new Date().toISOString()
      }];
    } catch (error: any) {
      logError(`[TransparenciaSP] Erro na busca: ${error.message}`);
      return [];
    }
  }

  /**
   * Extrai dados detalhados de um contrato ou empenho específico
   */
  async getDetail(url: string) {
    logInfo(`[TransparenciaSP] Extraindo detalhes de: ${url}`);
    return await ingestionService.ingest(url);
  }
}

export const transparenciaSPService = new TransparenciaSPService();
