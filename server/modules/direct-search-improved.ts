
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface DirectSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt: string;
  description?: string;
  content?: string;
}

export class DirectSearchImproved {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Resolve redirecionamentos do Google News usando requisição HTTP com follow
   */
  private async resolveGoogleNewsUrl(googleNewsUrl: string): Promise<string> {
    try {
      if (!googleNewsUrl.includes('news.google.com/rss/articles')) {
        return googleNewsUrl;
      }

      // Fazer requisição seguindo redirecionamentos
      const response = await axios.get(googleNewsUrl, {
        headers: { 
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
        },
        timeout: 8000,
        maxRedirects: 10,
        validateStatus: () => true
      });

      // A URL final após redirecionamentos
      if (response.request?.res?.responseUrl) {
        const finalUrl = response.request.res.responseUrl;
        if (!finalUrl.includes('google.com')) {
          return finalUrl;
        }
      }

      // Tentar extrair do HTML se houver meta refresh ou JavaScript redirect
      if (response.data && typeof response.data === 'string') {
        const $ = cheerio.load(response.data);
        
        // Procurar por links no HTML
        const links = $('a[href^="http"]').map((i, el) => $(el).attr('href')).get();
        const externalLink = links.find(l => l && !l.includes('google.com'));
        if (externalLink) {
          return externalLink;
        }

        // Procurar por meta refresh
        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
          const urlMatch = metaRefresh.match(/url=(.+)/i);
          if (urlMatch && !urlMatch[1].includes('google.com')) {
            return urlMatch[1];
          }
        }
      }

      return googleNewsUrl;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha ao resolver URL: ${googleNewsUrl.substring(0, 50)}...`);
      return googleNewsUrl;
    }
  }

  /**
   * Busca via Google News RSS com resolução de URLs
   */
  async searchGoogleNews(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via Google News RSS: ${query}`);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': this.getRandomUserAgent() }
      });
      const xml = response.data;
      const results: DirectSearchResult[] = [];
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      // Processar itens em paralelo (limitado a 6)
      const itemsToProcess = items.slice(0, 6);
      
      const resolvedResults = await Promise.all(itemsToProcess.map(async (item: string) => {
        const title = (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Sem título';
        const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Google News';
        const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';
        
        // Resolver a URL real
        const realUrl = await this.resolveGoogleNewsUrl(link);
        
        return {
          title: title.replace(/&amp;/g, '&').replace(/<!\[CDATA\[|\]\]>/g, ''),
          url: realUrl,
          snippet: title,
          description: title,
          source: source,
          publishedAt: pubDate || new Date().toISOString(),
          isResolved: !realUrl.includes('news.google.com')
        };
      }));
      
      // Manter todas as notícias, mesmo as não resolvidas (usaremos o título como conteúdo)
      for (const r of resolvedResults) {
        results.push({
          title: r.title,
          url: r.url,
          snippet: r.description || r.title,
          description: r.description,
          source: r.source,
          publishedAt: r.publishedAt,
          content: r.title // Usar título como conteúdo mínimo
        });
      }
      
      logInfo(`[DirectSearchImproved] Google News: ${results.length} resultados`);
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha no Google News RSS`, error as Error);
      return [];
    }
  }

  /**
   * Busca via Bing usando scraping
   */
  async searchBing(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via Bing: ${query}`);
    try {
      const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=pt-BR`;
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': this.getRandomUserAgent(),
          'Accept-Language': 'pt-BR,pt;q=0.9'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const results: DirectSearchResult[] = [];
      
      // Extrair resultados do Bing
      $('li.b_algo').each((i, el) => {
        const titleEl = $(el).find('h2 a');
        const title = titleEl.text().trim();
        const link = titleEl.attr('href');
        const snippet = $(el).find('.b_caption p').text().trim();
        
        if (title && link && link.startsWith('http')) {
          results.push({
            title,
            url: link,
            snippet,
            description: snippet,
            source: this.extractDomain(link),
            publishedAt: new Date().toISOString(),
            content: snippet
          });
        }
      });
      
      logInfo(`[DirectSearchImproved] Bing: ${results.length} resultados`);
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha no Bing`, error as Error);
      return [];
    }
  }

  /**
   * Busca via Wikipedia API (sempre funciona, sem bloqueio)
   */
  async searchWikipedia(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via Wikipedia: ${query}`);
    try {
      const url = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&srlimit=5`;
      const response = await axios.get(url, { timeout: 10000 });
      
      const results: DirectSearchResult[] = [];
      if (response.data?.query?.search) {
        for (const item of response.data.query.search) {
          results.push({
            title: item.title,
            url: `https://pt.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            snippet: item.snippet.replace(/<[^>]*>/g, ''),
            description: item.snippet.replace(/<[^>]*>/g, ''),
            source: 'Wikipedia',
            publishedAt: new Date().toISOString(),
            content: item.snippet.replace(/<[^>]*>/g, '')
          });
        }
      }
      
      logInfo(`[DirectSearchImproved] Wikipedia: ${results.length} resultados`);
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha na Wikipedia`, error as Error);
      return [];
    }
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Web';
    }
  }

  async search(query: string): Promise<DirectSearchResult[]> {
    // Orquestração de busca gratuita com múltiplas fontes confiáveis
    const [news, bing, wiki] = await Promise.all([
      this.searchGoogleNews(query),
      this.searchBing(query),
      this.searchWikipedia(query)
    ]);
    
    const results = [...news, ...bing, ...wiki];
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    
    // Filtrar URLs inválidas
    const validResults = uniqueResults.filter(r => {
      try {
        const parsed = new URL(r.url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    });
    
    logInfo(`[DirectSearchImproved] Busca finalizada. Total único válido: ${validResults.length}`);
    return validResults;
  }
}

export const directSearchImproved = new DirectSearchImproved();
