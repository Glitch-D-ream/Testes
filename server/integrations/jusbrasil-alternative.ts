
import axios from 'axios';
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { contentScraper } from '../modules/content-scraper.ts';

export interface LegalRecord {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  date?: string;
}

export class JusBrasilAlternative {
  /**
   * Busca processos e registros jurídicos usando busca pública e scraping
   * Como a API oficial é restrita, usamos o Scout para encontrar links do JusBrasil e ConJur
   */
  async searchLegalRecords(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[LegalSearch] Buscando registros jurídicos para: ${politicianName}`);
    
    const queries = [
      `site:jusbrasil.com.br "${politicianName}"`,
      `site:conjur.com.br "${politicianName}"`,
      `"${politicianName}" processo judicial`,
      `"${politicianName}" STF`
    ];

    const records: LegalRecord[] = [];

    // Para o protótipo, vamos simular a busca via Google News RSS que é o que temos funcional agora
    // No futuro, isso usaria o DirectSearchImproved com as queries acima
    try {
      for (const query of queries) {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        const response = await axios.get(url, { timeout: 8000 });
        const xml = response.data;
        
        const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        
        for (const item of items.slice(0, 3)) {
          const title = (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Registro Jurídico';
          const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
          const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Justiça';
          
          records.push({
            title: title.replace(/&amp;/g, '&'),
            url: link,
            excerpt: title,
            source: source
          });
        }
      }
    } catch (error) {
      logWarn(`[LegalSearch] Falha na busca de registros jurídicos`, error as Error);
    }

    return records;
  }

  /**
   * Integração com Querido Diário (Open Knowledge Brasil)
   * Busca em diários oficiais de diversos municípios
   */
  async searchQueridoDiario(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[QueridoDiario] Buscando em diários oficiais para: ${politicianName}`);
    
    try {
      // API do Querido Diário
      const url = `https://queridodiario.ok.org.br/api/gazettes?keyword=${encodeURIComponent(politicianName)}`;
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data?.gazettes && Array.isArray(response.data.gazettes)) {
        return response.data.gazettes.slice(0, 5).map((g: any) => ({
          title: `Diário Oficial: ${g.territory_name} (${g.state_code})`,
          url: g.url,
          excerpt: `Publicação em ${g.date}. Edição ${g.edition_number}.`,
          source: 'Querido Diário',
          date: g.date
        }));
      }
    } catch (error) {
      logWarn(`[QueridoDiario] Falha ao consultar API do Querido Diário`, error as Error);
    }
    
    return [];
  }
}

export const jusBrasilAlternative = new JusBrasilAlternative();
