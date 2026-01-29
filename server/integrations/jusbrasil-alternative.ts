
import axios from 'axios';
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { browserScraper } from '../modules/browser-scraper.ts';

export interface LegalRecord {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  date?: string;
  content?: string;
}

export class JusBrasilAlternative {
  /**
   * Busca registros via Google News RSS (Estável e Rápido)
   */
  private async searchRSS(query: string, label: string): Promise<LegalRecord[]> {
    logInfo(`[LegalRSS] Buscando ${label} para: ${query}`);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await axios.get(url, { timeout: 8000 });
      const xml = response.data;
      
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      return items.slice(0, 5).map((item: string) => {
        const title = (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Registro';
        const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
        const date = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || label;
        
        return {
          title: title.replace(/&amp;/g, '&'),
          url: link,
          excerpt: `Registro detectado em ${date}. Fonte original: ${source}`,
          source: label,
          date: date
        };
      });
    } catch (error) {
      logWarn(`[LegalRSS] Falha na busca RSS ${label}`, error as Error);
      return [];
    }
  }

  /**
   * Busca no Jusbrasil Público via DuckDuckGo (Links Diretos)
   */
  private async searchJusbrasilLinks(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[JusSearch] Buscando links Jusbrasil para: ${politicianName}`);
    try {
      const query = `site:jusbrasil.com.br/processos "${politicianName}"`;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const html = await browserScraper.scrape(searchUrl);
      
      if (!html) return [];

      const records: LegalRecord[] = [];
      const matches = html.matchAll(/href="([^"]+)"/g);
      
      for (const match of matches) {
        let url = match[1];
        if (url.includes('uddg=')) url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
        
        if (url.includes('jusbrasil.com.br/processos') && !url.includes('duckduckgo')) {
          records.push({
            title: `Processo Judicial - Jusbrasil`,
            url: url,
            excerpt: 'Página de processos localizada no Jusbrasil.',
            source: 'Justiça / Jusbrasil'
          });
        }
        if (records.length >= 3) break;
      }
      return records;
    } catch { return []; }
  }

  /**
   * Busca processos e registros jurídicos usando busca pública real
   */
  async searchLegalRecords(politicianName: string): Promise<LegalRecord[]> {
    const [rssResults, jusLinks] = await Promise.all([
      this.searchRSS(`"${politicianName}" (processo OR judicial OR liminar OR condenação)`, 'Justiça / Processos'),
      this.searchJusbrasilLinks(politicianName)
    ]);
    return [...jusLinks, ...rssResults];
  }

  /**
   * Busca em Diários Oficiais via busca pública resiliente
   */
  async searchQueridoDiario(politicianName: string): Promise<LegalRecord[]> {
    return this.searchRSS(`"${politicianName}" "diário oficial"`, 'Diário Oficial');
  }
}

export const jusBrasilAlternative = new JusBrasilAlternative();
