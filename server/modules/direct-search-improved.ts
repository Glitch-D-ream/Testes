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
            results.push({
              title: result.Result || 'Resultado de Busca',
              url: result.FirstURL,
              snippet: result.Text,
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
            results.push({
              title: result.Result || 'Resultado',
              url: result.FirstURL,
              snippet: result.Text,
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
            results.push({
              title: topic.Result || topic.Text.substring(0, 50),
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
   * Orquestra a busca direta
   */
  async search(query: string): Promise<DirectSearchResult[]> {
    // Tentar DuckDuckGo API primeiro (mais confiável)
    let results = await this.searchDuckDuckGoAPI(query);
    
    // Se não encontrar nada, tentar alternativa
    if (results.length === 0) {
      results = await this.searchBingAlternative(query);
    }

    return results;
  }
}

export const directSearchImproved = new DirectSearchImproved();
