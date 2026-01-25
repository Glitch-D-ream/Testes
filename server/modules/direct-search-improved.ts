/**
 * Módulo de Busca Direta Melhorado (Direct Search v2)
 * Usa cheerio para parsing HTML mais robusto e confiável.
 * Coleta URLs e snippets sem depender de IA.
 */

import axios from 'axios';
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
   * Busca usando a API de Busca do Bing (mais amigável)
   * Nota: Requer registro em https://www.microsoft.com/en-us/bing/apis/bing-web-search-api
   * Alternativa: Usar DuckDuckGo API se disponível
   */
  async searchBingAlternative(query: string): Promise<DirectSearchResult[]> {
    logInfo(`[DirectSearchImproved] Tentando busca alternativa para: ${query}`);
    
    try {
      // Tentar usar a API de busca do SerpAPI como alternativa (gratuita com limite)
      // Ou usar a API do Bing Search
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_redirect: 1,
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 10000
      });

      const results: DirectSearchResult[] = [];
      
      // DuckDuckGo JSON API retorna resultados em 'Results'
      if (response.data?.Results && Array.isArray(response.data.Results)) {
        response.data.Results.slice(0, 10).forEach((result: any) => {
          if (result.FirstURL && result.Text) {
            // Limpar tags HTML simples (como <a>) que o DDG às vezes retorna
            const cleanTitle = (result.Result || 'Resultado de Busca').replace(/<[^>]*>/g, '').trim();
            const cleanSnippet = result.Text.replace(/<[^>]*>/g, '').trim();
            
            results.push({
              title: cleanTitle,
              url: result.FirstURL,
              snippet: cleanSnippet,
              source: this.extractDomain(result.FirstURL),
              publishedAt: new Date().toISOString()
            });
          }
        });
      }

      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha na busca alternativa`, error as Error);
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
        params: {
          q: query,
          format: 'json',
          no_redirect: 1,
          no_html: 1,
          skip_disambig: 1
        },
        headers: {
          'User-Agent': this.getRandomUserAgent()
        },
        timeout: 10000
      });

      const results: DirectSearchResult[] = [];
      
      // Resultados principais
      if (response.data?.Results && Array.isArray(response.data.Results)) {
        response.data.Results.slice(0, 5).forEach((result: any) => {
          if (result.FirstURL && result.Text) {
            const cleanTitle = (result.Result || 'Resultado').replace(/<[^>]*>/g, '').trim();
            const cleanSnippet = result.Text.replace(/<[^>]*>/g, '').trim();
            
            results.push({
              title: cleanTitle,
              url: result.FirstURL,
              snippet: cleanSnippet,
              source: this.extractDomain(result.FirstURL),
              publishedAt: new Date().toISOString()
            });
          }
        });
      }

      // Resultados relacionados (RelatedTopics)
      if (response.data?.RelatedTopics && Array.isArray(response.data.RelatedTopics)) {
        response.data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.FirstURL && topic.Text) {
            const cleanTitle = (topic.Result || topic.Text.substring(0, 50)).replace(/<[^>]*>/g, '').trim();
            const cleanSnippet = topic.Text.replace(/<[^>]*>/g, '').trim();
            
            results.push({
              title: cleanTitle,
              url: topic.FirstURL,
              snippet: cleanSnippet,
              source: this.extractDomain(topic.FirstURL),
              publishedAt: new Date().toISOString()
            });
          }
        });
      }

      return results;
    } catch (error) {
      logError(`[DirectSearchImproved] Falha na API DuckDuckGo`, error as Error);
      return [];
    }
  }

  /**
   * Extrai o domínio de uma URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Web';
    }
  }

  /**
   * Busca via Google News RSS (Extremamente confiável para notícias)
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
        const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || new Date().toISOString();
        const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Google News';
        
        results.push({
          title: title.replace(/&amp;/g, '&'),
          url: link,
          snippet: title, // No RSS o título costuma ser o resumo
          source: source,
          publishedAt: new Date(pubDate).toISOString()
        });
      }
      return results;
    } catch (error) {
      logWarn(`[DirectSearchImproved] Falha no Google News RSS`, error as Error);
      return [];
    }
  }

  /**
   * Orquestra a busca direta
   */
  async search(query: string): Promise<DirectSearchResult[]> {
    // 1. Tentar Google News primeiro para notícias políticas (Alta Qualidade)
    let results = await this.searchGoogleNews(query);
    
    // 2. Tentar DuckDuckGo API como complemento
    const ddgResults = await this.searchDuckDuckGoAPI(query);
    results = [...results, ...ddgResults];
    
    // 3. Se ainda estiver vazio, tentar alternativa
    if (results.length === 0) {
      results = await this.searchBingAlternative(query);
    }

    // Remover duplicatas por URL
    const uniqueResults = Array.from(new Map(results.map(item => [item.url, item])).values());
    return uniqueResults;
  }
}

export const directSearchImproved = new DirectSearchImproved();
