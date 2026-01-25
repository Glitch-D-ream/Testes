import axios from 'axios';
import { nanoid } from 'nanoid';
import { logInfo, logError, logWarn } from '../core/logger.js';

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

    // Tentativa 1: Busca via IA (Pollinations)
    try {
      sources = await this.searchViaAI(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via IA. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via IA. Tentando fallback...`, error as Error);
    }

    // Tentativa 2: Busca via RSS Feeds
    try {
      sources = await this.searchViaRSSFeeds(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via RSS. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via RSS. Tentando fallback final...`, error as Error);
    }

    // Tentativa 3: Busca genérica (fallback de último recurso)
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
   * Busca via RSS Feeds de portais de notícias
   */
  private async searchViaRSSFeeds(query: string): Promise<RawSource[]> {
    const sources: RawSource[] = [];

    for (const feedUrl of this.fallbackRSSFeeds) {
      try {
        logInfo(`[Multi-Scout] Tentando feed RSS: ${feedUrl}`);
        
        const response = await axios.get(feedUrl, { timeout: 10000 });
        const feedContent = response.data;

        // Parsing simples de RSS (em produção, usar xml2js ou similar)
        const titleMatches = feedContent.match(/<title>([^<]+)<\/title>/g) || [];
        const descMatches = feedContent.match(/<description>([^<]+)<\/description>/g) || [];
        const linkMatches = feedContent.match(/<link>([^<]+)<\/link>/g) || [];

        for (let i = 0; i < Math.min(3, titleMatches.length); i++) {
          const title = titleMatches[i]?.replace(/<[^>]+>/g, '') || 'Sem título';
          
          // Verificar se a notícia é relevante para a query
          if (title.toLowerCase().includes(query.toLowerCase())) {
            sources.push({
              id: nanoid(),
              url: linkMatches[i]?.replace(/<[^>]+>/g, '') || `https://news/${nanoid()}`,
              title: title,
              content: descMatches[i]?.replace(/<[^>]+>/g, '') || 'Sem conteúdo',
              source: new URL(feedUrl).hostname || 'RSS Feed',
              publishedAt: new Date().toISOString(),
              confidence: 'medium'
            });
          }
        }

        if (sources.length > 0) break;
      } catch (error) {
        logWarn(`[Multi-Scout] Feed RSS falhou: ${feedUrl}`, error as Error);
      }
    }

    if (sources.length === 0) {
      throw new Error('Nenhum feed RSS disponível');
    }

    return sources;
  }

  /**
   * Busca genérica de último recurso
   * Retorna dados estruturados mesmo sem fonte externa real
   */
  private async searchGeneric(query: string): Promise<RawSource[]> {
    logWarn(`[Multi-Scout] Usando fallback genérico para: ${query}`);

    // Gerar dados estruturados baseado no query
    return [
      {
        id: nanoid(),
        url: `https://generic-search/${nanoid()}`,
        title: `Análise de Compromissos: ${query}`,
        content: `Busca genérica para ${query}. Nenhuma fonte externa disponível no momento. Sistema em modo fallback.`,
        source: 'Generic Fallback',
        publishedAt: new Date().toISOString(),
        confidence: 'low'
      }
    ];
  }
}

export const multiScoutAgent = new MultiScoutAgent();
