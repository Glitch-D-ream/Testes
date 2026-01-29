
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
   * Busca registros via Wikipedia Search API (Livre de bloqueios e retorna links externos)
   */
  private async searchWikipediaExternal(query: string): Promise<LegalRecord[]> {
    logInfo(`[WikiSearch] Buscando links externos para: ${query}`);
    try {
      const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&srlimit=5`;
      const response = await axios.get(url, { timeout: 5000 });
      const searchResults = response.data?.query?.search || [];
      
      const records: LegalRecord[] = [];
      for (const result of searchResults) {
        // Para cada resultado, vamos considerar o snippet como uma pista jurídica
        records.push({
          title: result.title,
          url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
          excerpt: result.snippet.replace(/<[^>]+>/g, ''),
          source: 'Wikipedia/Registros Públicos'
        });
      }
      return records;
    } catch (error) {
      logWarn(`[WikiSearch] Falha na busca Wikipedia`, error as Error);
      return [];
    }
  }

  /**
   * Busca processos e registros jurídicos usando busca pública real
   */
  async searchLegalRecords(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[LegalSearch] Buscando registros jurídicos REAIS para: ${politicianName}`);
    
    // Tentar busca via Wikipedia como proxy para eventos jurídicos notáveis
    const results = await this.searchWikipediaExternal(`${politicianName} processo judicial`);
    
    const records: LegalRecord[] = [];

    const ingestionPromises = results.map(async (r) => {
      try {
        const ingestion = await ingestionService.ingest(r.url, { keywords: [politicianName, 'processo', 'decisão'] });
        if (ingestion) {
          return {
            ...r,
            excerpt: ingestion.content.substring(0, 300) + "...",
            content: ingestion.content
          };
        }
      } catch (e) { return null; }
      return null;
    });

    const realRecords = await Promise.all(ingestionPromises);
    records.push(...(realRecords.filter(r => r !== null) as LegalRecord[]));
    
    return records;
  }

  /**
   * Busca em Diários Oficiais via busca pública resiliente
   */
  async searchQueridoDiario(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[QueridoDiario] Buscando diários oficiais para: ${politicianName}`);
    
    // Fallback para o Querido Diário via Axios direto (tentando novamente com headers mínimos)
    try {
      const url = `https://queridodiario.ok.org.br/api/gazettes?keyword=${encodeURIComponent(politicianName)}`;
      const response = await axios.get(url, { 
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.data?.gazettes) {
        return response.data.gazettes.slice(0, 5).map((g: any) => ({
          title: `Diário Oficial: ${g.territory_name}`,
          url: g.url,
          excerpt: `Publicação em ${g.date}.`,
          source: 'Querido Diário',
          date: g.date
        }));
      }
    } catch {
      logWarn(`[QueridoDiario] API Direta falhou. Usando busca de notícias como proxy.`);
      // Usar Google News RSS como proxy para menções em Diários Oficiais citadas na mídia
      const query = `"${politicianName}" "diário oficial"`;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      try {
        const res = await axios.get(rssUrl);
        const items = res.data.match(/<item>[\s\S]*?<\/item>/g) || [];
        return items.slice(0, 3).map((item: string) => ({
          title: (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Menção em Diário Oficial',
          url: (item.match(/<link>(.*?)<\/link>/))?.[1] || '',
          excerpt: 'Menção detectada em fonte de notícias.',
          source: 'Diário Oficial (via Notícias)'
        }));
      } catch { return []; }
    }
    
    return [];
  }
}

export const jusBrasilAlternative = new JusBrasilAlternative();
