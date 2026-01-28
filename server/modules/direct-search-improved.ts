
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface DirectSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt: string;
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
   * Busca via DuckDuckGo HTML (Scraping gratuito e sem API key)
   */
  async searchDuckDuckGoHTML(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via DuckDuckGo HTML: ${query}`);
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const results: DirectSearchResult[] = [];
      
      $('.result').each((i, el) => {
        const titleEl = $(el).find('.result__a');
        const title = titleEl.text().trim();
        const link = titleEl.attr('href');
        const snippet = $(el).find('.result__snippet').text().trim();
        
        if (title && link) {
          // Extrair URL real se for um link de redirecionamento do DDG
          let realLink = link;
          if (link.includes('uddg=')) {
            const match = link.match(/uddg=([^&]+)/);
            if (match) realLink = decodeURIComponent(match[1]);
          }

          results.push({
            title,
            url: realLink,
            snippet,
            source: this.extractDomain(realLink),
            publishedAt: new Date().toISOString()
          });
        }
      });
      
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha no DuckDuckGo HTML`, error as Error);
      return [];
    }
  }

  /**
   * Busca usando a API pública do DuckDuckGo (JSON)
   */
  async searchDuckDuckGoAPI(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via DuckDuckGo API: ${query}`);
    try {
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_redirect: 1, no_html: 1, skip_disambig: 1 },
        headers: { 'User-Agent': this.getRandomUserAgent() },
        timeout: 10000
      });

      const results: DirectSearchResult[] = [];
      if (response.data?.RelatedTopics) {
        response.data.RelatedTopics.forEach((topic: any) => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text,
              source: this.extractDomain(topic.FirstURL),
              publishedAt: new Date().toISOString()
            });
          }
        });
      }
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha na API DuckDuckGo`, error as Error);
      return [];
    }
  }

  /**
   * Busca via Google News RSS
   */
  async searchGoogleNews(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Buscando via Google News RSS: ${query}`);
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const response = await axios.get(url, { timeout: 10000 });
      const xml = response.data;
      const results: DirectSearchResult[] = [];
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items.slice(0, 10)) {
        const title = (item.match(/<title>(.*?)<\/title>/))?.[1] || 'Sem título';
        const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Google News';
        
        results.push({
          title: title.replace(/&amp;/g, '&'),
          url: link,
          snippet: title,
          source: source,
          publishedAt: new Date().toISOString()
        });
      }
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha no Google News RSS`, error as Error);
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
    // Orquestração de busca gratuita
    const [news, html, api] = await Promise.all([
      this.searchGoogleNews(query),
      this.searchDuckDuckGoHTML(query),
      this.searchDuckDuckGoAPI(query)
    ]);
    
    const results = [...news, ...html, ...api];
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    
    logInfo(`[DirectSearchImproved] Busca finalizada. Total único: ${uniqueResults.length}`);
    return uniqueResults;
  }
}

export const directSearchImproved = new DirectSearchImproved();
