import axios from 'axios';
import { nanoid } from 'nanoid';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface RawSource {
  id: string;
  url: string;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Multi-Scout Agent: Busca resiliente com redundância de APIs
 * Implementa um sistema de fallback para garantir que a busca nunca falhe completamente
 */
export class MultiScoutAgent {
  private readonly primaryModels = ['openai', 'mistral', 'llama'];
  private readonly fallbackRSSFeeds = [
    'https://feeds.folha.uol.com.br/poder',
    'https://g1.globo.com/dynamo/politica/feed.xml',
    'https://www.poder360.com.br/feed/'
  ];

  async search(query: string): Promise<RawSource[]> {
    logInfo(`[Multi-Scout] Iniciando busca resiliente para: ${query}`);
    
    let sources: RawSource[] = [];

    // Tentativa 1: Busca via DuckDuckGo (Custo Zero, Rápido)
    sources = await this.searchViaDuckDuckGo(query);
    if (sources.length > 0) {
      logInfo(`[Multi-Scout] Sucesso na busca via DuckDuckGo. ${sources.length} fontes encontradas.`);
      return sources;
    }

    // Tentativa 2: Busca via IA (Pollinations - Fallback)
    try {
      sources = await this.searchViaAI(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via IA. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via IA. Tentando fallback...`, error as Error);
    }

    // Tentativa 3: Busca via RSS Feeds
    try {
      sources = await this.searchViaRSSFeeds(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via RSS. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via RSS. Tentando fallback final...`, error as Error);
    }

    // Tentativa 4: Busca genérica (fallback de último recurso)
    try {
      sources = await this.searchGeneric(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca genérica. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logError(`[Multi-Scout] Todas as tentativas falharam.`, error as Error);
    }

    return [];
  }

  /**
   * Busca via IA com múltiplos modelos
   */
  private async searchViaAI(query: string): Promise<RawSource[]> {
    for (const model of this.primaryModels) {
      try {
        logInfo(`[Multi-Scout] Tentando modelo: ${model}`);
        
        const prompt = `Busque notícias recentes sobre "${query}" em português. 
        Retorne um JSON com array de objetos contendo: title, content (resumo), url, publishedAt (ISO date).
        Exemplo: {"results": [{"title": "...", "content": "...", "url": "...", "publishedAt": "2026-01-24T..."}]}`;

        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [
            { role: 'system', content: 'Você é um agregador de notícias. Responda apenas JSON.' },
            { role: 'user', content: prompt }
          ],
          model: model,
          jsonMode: true
        }, { timeout: 15000 });

        let data = response.data;
        if (typeof data === 'string') {
          data = JSON.parse(data.replace(/```json\n?|\n?```/g, '').trim());
        }

        if (data && data.results && Array.isArray(data.results)) {
          return data.results.map((item: any) => ({
            id: nanoid(),
            url: item.url || `https://news.search/${nanoid()}`,
            title: item.title || 'Sem título',
            content: item.content || 'Sem conteúdo',
            source: model,
            publishedAt: item.publishedAt || new Date().toISOString(),
            confidence: 'medium'
          }));
        }
      } catch (error) {
        logWarn(`[Multi-Scout] Modelo ${model} falhou:`, error as Error);
      }
    }
    throw new Error('Nenhum modelo de IA disponível');
  }

  /**
   * Busca via DuckDuckGo (Custo Zero e Sem API Key)
   */
  private async searchViaDuckDuckGo(query: string): Promise<RawSource[]> {
    try {
      logInfo(`[Multi-Scout] Tentando busca via DuckDuckGo: ${query}`);
      // Usando a versão lite do DuckDuckGo que é mais estável para scraping
      const response = await axios.get(`https://duckduckgo.com/lite/`, {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const sources: RawSource[] = [];
      
      // Regex para a versão Lite do DuckDuckGo
      const resultRegex = /<a class="result-link" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<td class="result-snippet">([^<]+)<\/td>/g;
      let match;
      let count = 0;

      while ((match = resultRegex.exec(html)) !== null && count < 5) {
        sources.push({
          id: nanoid(),
          url: match[1],
          title: match[2].trim(),
          content: match[3].trim(),
          source: 'DuckDuckGo',
          publishedAt: new Date().toISOString(),
          confidence: 'medium'
        });
        count++;
      }

      return sources;
    } catch (error) {
      logWarn(`[Multi-Scout] DuckDuckGo falhou:`, error as Error);
      return [];
    }
  }

  /**
   * Busca via RSS Feeds de portais de notícias
   */
  private async searchViaRSSFeeds(query: string): Promise<RawSource[]> {
    const sources: RawSource[] = [];

    for (const feedUrl of this.fallbackRSSFeeds) {
      try {
        logInfo(`[Multi-Scout] Tentando feed RSS: ${feedUrl}`);
        
        const response = await axios.get(feedUrl, { timeout: 10000 });
        const feedContent = response.data;

        // Parsing de RSS mais robusto com regex
        const items = feedContent.match(/<item>[\s\S]*?<\/item>/g) || [];

        for (const item of items) {
          const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || 'Sem título';
          const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
          const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1] || 'Sem conteúdo';
          
          // Verificar relevância
          if (title.toLowerCase().includes(query.toLowerCase()) || description.toLowerCase().includes(query.toLowerCase())) {
            sources.push({
              id: nanoid(),
              url: link,
              title: title.replace(/<[^>]+>/g, ''),
              content: description.replace(/<[^>]+>/g, '').substring(0, 300),
              source: new URL(feedUrl).hostname || 'RSS Feed',
              publishedAt: new Date().toISOString(),
              confidence: 'medium'
            });
          }
          if (sources.length >= 5) break;
        }

        if (sources.length > 0) break;
      } catch (error) {
        logWarn(`[Multi-Scout] Feed RSS falhou: ${feedUrl}`, error as Error);
      }
    }

    return sources;
  }

  /**
   * Busca genérica de último recurso (Desativada para evitar ruído)
   */
  private async searchGeneric(query: string): Promise<RawSource[]> {
    logWarn(`[Multi-Scout] Fallback genérico desativado para evitar dados inúteis para: ${query}`);
    return [];
  }
}

export const multiScoutAgent = new MultiScoutAgent();
