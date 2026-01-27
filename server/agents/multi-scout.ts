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
  credibilityLayer: 'A' | 'B' | 'C'; // A: Oficial/Planos, B: Jornalismo, C: Redes Sociais
}

/**
 * Multi-Scout Agent: Busca resiliente com redundância de APIs
 * Implementa um sistema de fallback para garantir que a busca nunca falhe completamente
 */
export class MultiScoutAgent {
  private readonly primaryModels = [
    'openai', 'mistral', 'llama', // Originais
    'deepseek-r1', 'llama-3.3-70b', 'mistral-large' // Backups
  ];
  private readonly fallbackRSSFeeds = [
    'https://feeds.folha.uol.com.br/poder',
    'https://g1.globo.com/dynamo/politica/feed.xml',
    'https://www.poder360.com.br/feed/'
  ];

  private readonly nitterInstances = [
    'https://nitter.net',
    'https://nitter.cz',
    'https://nitter.privacydev.net',
    'https://nitter.it',
    'https://nitter.poast.org',
    'https://nitter.moomoo.me'
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

    // Tentativa 3: Busca via Social Scout (Nitter/RSS)
    try {
      const socialSources = await this.searchViaSocialRSS(query);
      if (socialSources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via Social Scout. ${socialSources.length} fontes encontradas.`);
        sources.push(...socialSources);
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via Social Scout.`, error as Error);
    }

    // Tentativa 4: Busca via RSS Feeds de Notícias
    try {
      const newsRSS = await this.searchViaRSSFeeds(query);
      if (newsRSS.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via RSS de Notícias. ${newsRSS.length} fontes encontradas.`);
        sources.push(...newsRSS);
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via RSS de Notícias.`, error as Error);
    }

    if (sources.length > 0) return sources;

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
          return data.results.map((item: any) => {
            // Determinar camada de credibilidade baseada na URL
            let layer: 'A' | 'B' | 'C' = 'B';
            const url = (item.url || '').toLowerCase();
            if (url.includes('.gov.br') || url.includes('.leg.br') || url.includes('tse.jus.br')) layer = 'A';
            else if (url.includes('twitter.com') || url.includes('x.com') || url.includes('facebook.com')) layer = 'C';

            return {
              id: nanoid(),
              url: item.url || `https://news.search/${nanoid()}`,
              title: item.title || 'Sem título',
              content: item.content || 'Sem conteúdo',
              source: model,
              publishedAt: item.publishedAt || new Date().toISOString(),
              confidence: layer === 'A' ? 'high' : 'medium',
              credibilityLayer: layer
            };
          });
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
        const url = match[1].toLowerCase();
        let layer: 'A' | 'B' | 'C' = 'B';
        if (url.includes('.gov.br') || url.includes('.leg.br')) layer = 'A';
        else if (url.includes('twitter.com') || url.includes('x.com')) layer = 'C';

        sources.push({
          id: nanoid(),
          url: match[1],
          title: match[2].trim(),
          content: match[3].trim(),
          source: 'DuckDuckGo',
          publishedAt: new Date().toISOString(),
          confidence: layer === 'A' ? 'high' : 'medium',
          credibilityLayer: layer
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
              confidence: 'medium',
              credibilityLayer: 'B' // RSS de portais jornalísticos é Camada B
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
   * Busca via Social Scout (Nitter RSS)
   * Tenta encontrar o perfil do político e extrair os tweets mais recentes via RSS
   */
  private async searchViaSocialRSS(query: string): Promise<RawSource[]> {
    const sources: RawSource[] = [];
    
    // Gerar variações de username prováveis
    const nameParts = query.toLowerCase().split(/\s+/);
    const usernames = [
      nameParts.join(''), // jonesmanoel
      nameParts.join('_'), // jones_manoel
      nameParts[0], // jones
      nameParts.length > 1 ? `${nameParts[0]}${nameParts[1]}` : null
    ].filter(Boolean) as string[];

    // Tentar algumas instâncias do Nitter
    for (const instance of this.nitterInstances) {
      for (const username of usernames) {
        try {
          // Tentar buscar pelo nome de usuário provável
          const feedUrl = `${instance}/${username}/rss`;
          logInfo(`[Multi-Scout] Tentando Social Scout (Nitter): ${feedUrl}`);
          
          const response = await axios.get(feedUrl, { timeout: 5000 });
          const feedContent = response.data;
          const items = feedContent.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || 'Post Social';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1] || '';
            
            sources.push({
              id: nanoid(),
              url: link.replace(new URL(instance).hostname, 'twitter.com'), // Converter de volta para link original
              title: title.replace(/<[^>]+>/g, '').substring(0, 100),
              content: description.replace(/<[^>]+>/g, '').substring(0, 500),
              source: 'Twitter/X (via Nitter)',
              publishedAt: new Date().toISOString(),
              confidence: 'medium',
              credibilityLayer: 'C'
            });
            if (sources.length >= 5) break;
          }

          if (sources.length > 0) {
            logInfo(`[Multi-Scout] Social Scout obteve ${sources.length} posts para ${username}`);
            return sources;
          }
        } catch (error) {
          // Silencioso para não poluir o log com tentativas de username erradas
        }
      }
    }
    logWarn(`[Multi-Scout] Social Scout não encontrou perfil para: ${query}`);

    return [];
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
