
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from './browser-scraper.ts';
import { directSearchImproved } from './direct-search-improved.ts';

export interface JusBrasilRecord {
  title: string;
  url: string;
  content: string;
  court?: string;
  processNumber?: string;
}

/**
 * JusBrasilScraper
 * Especializado em extrair dados de processos e jurisprudência do JusBrasil
 */
export class JusBrasilScraper {
  /**
   * Busca e extrai dados do JusBrasil para um político
   */
  async searchAndScrape(politicianName: string): Promise<JusBrasilRecord[]> {
    logInfo(`[JusBrasilScraper] Iniciando busca jurídica especializada para: ${politicianName}`);
    
    try {
      // 1. Buscar links do JusBrasil via DirectSearch (Query mais flexível)
      const queries = [
        `site:jusbrasil.com.br "${politicianName}"`,
        `"${politicianName}" JusBrasil processo`,
        `"${politicianName}" JusBrasil jurisprudência`
      ];
      
      let allResults: any[] = [];
      for (const q of queries) {
        const results = await directSearchImproved.search(q);
        allResults = [...allResults, ...results];
      }
      
      // Remover duplicatas e filtrar por JusBrasil
      const jusLinks = allResults
        .filter((r, index, self) => 
          r.url.includes('jusbrasil.com.br') && 
          self.findIndex(t => t.url === r.url) === index
        )
        .slice(0, 5);

      logInfo(`[JusBrasilScraper] Encontrados ${jusLinks.length} links únicos no JusBrasil.`);

      const records: JusBrasilRecord[] = [];

      // 2. Scraping paralelo dos links encontrados
      const scrapePromises = jusLinks.map(async (link) => {
        try {
          const content = await browserScraper.scrape(link.url);
          if (!content) return null;

          // Extrair número do processo se disponível no título ou conteúdo
          const processMatch = content.match(/\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/);
          
          return {
            title: link.title,
            url: link.url,
            content: content,
            processNumber: processMatch ? processMatch[0] : undefined,
            court: this.detectCourt(content)
          };
        } catch (err) {
          logWarn(`[JusBrasilScraper] Falha ao extrair ${link.url}: ${err}`);
          return null;
        }
      });

      const results = await Promise.all(scrapePromises);
      return results.filter(r => r !== null) as JusBrasilRecord[];

    } catch (error) {
      logError(`[JusBrasilScraper] Erro na busca/extração:`, error as Error);
      return [];
    }
  }

  private detectCourt(text: string): string | undefined {
    const courts = ['STF', 'STJ', 'TJSP', 'TJRJ', 'TRF', 'TST', 'TSE'];
    for (const court of courts) {
      if (text.includes(court)) return court;
    }
    return undefined;
  }
}

export const jusBrasilScraper = new JusBrasilScraper();
