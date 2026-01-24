import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';
import { saveScoutHistory, checkUrlExists } from '../core/database.js';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official';
  confidence: 'high' | 'medium' | 'low';
}

export class ScoutAgent {
  // Whitelist de domínios confiáveis para evitar Fake News
  private readonly whitelist = [
    'g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'cnnbrasil.com.br',
    'valor.globo.com', 'bbc.com', 'elpais.com', 'uol.com.br', 'r7.com',
    'metropoles.com', 'poder360.com.br', 'agenciabrasil.ebc.com.br',
    'camara.leg.br', 'senado.leg.br', 'planalto.gov.br'
  ];

  async search(query: string): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando varredura multicanal para: ${query}`);
    
    const sources: RawSource[] = [];
    
    try {
      // 1. RSS Feeds (Alta Confiança)
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);

      // 2. Busca Web (Pollinations) - Apenas se necessário
      if (sources.length < 5) {
        const webResults = await this.fetchFromWeb(query);
        sources.push(...webResults);
      }
      
      const newSources: RawSource[] = [];
      for (const source of sources) {
        // Validação de URL e Whitelist
        if (!this.isValidUrl(source.url)) continue;
        
        const isTrusted = this.whitelist.some(domain => source.url.includes(domain));
        source.confidence = isTrusted ? 'high' : 'medium';

        const exists = await checkUrlExists(source.url);
        if (!exists) {
          await saveScoutHistory({
            url: source.url,
            title: source.title,
            content: source.content,
            source: source.source,
            politicianName: query,
            publishedAt: source.publishedAt
          });
          newSources.push(source);
        }
      }
      
      logInfo(`[Scout] Varredura concluída. ${newSources.length} novas fontes validadas.`);
      return newSources;
    } catch (error) {
      logError(`[Scout] Erro na varredura de ${query}`, error as Error);
      return [];
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async fetchFromWeb(query: string): Promise<RawSource[]> {
    const prompt = `Aja como um buscador de notícias. Liste as 5 notícias ou falas reais mais recentes do político "${query}" sobre promessas ou planos. 
    Retorne apenas um array JSON: [{"title": "string", "url": "string", "content": "string", "source": "string", "date": "string"}]
    Dê preferência a links de grandes portais como G1, Folha, Estadão.`;

    try {
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'Você é um buscador de notícias políticas brasileiras. Responda apenas JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'openai',
        jsonMode: true
      }, { timeout: 30000 });

      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data.replace(/```json\n?|\n?```/g, '').trim());
      }
      
      return (data as any[]).map(item => ({
        title: item.title,
        url: item.url,
        content: item.content || item.snippet || '',
        source: item.source || 'Web Search',
        publishedAt: item.date,
        type: 'news',
        confidence: 'medium'
      }));
    } catch (error) {
      logError('[Scout] Falha ao buscar na Web', error as Error);
      return [];
    }
  }

  private async fetchFromRSS(query: string): Promise<RawSource[]> {
    const feeds = [
      { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
      { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
      { name: 'R7 Brasília', url: 'https://noticias.r7.com/brasilia/feed.xml' }
    ];

    const results: RawSource[] = [];
    const queryLower = query.toLowerCase();

    for (const feed of feeds) {
      try {
        const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, { timeout: 10000 });
        
        if (response.data?.items) {
          const matchedItems = response.data.items.filter((item: any) => 
            item.title.toLowerCase().includes(queryLower) || 
            (item.description && item.description.toLowerCase().includes(queryLower))
          );

          for (const item of matchedItems) {
            results.push({
              title: item.title,
              url: item.link,
              content: item.description || item.content || '',
              source: feed.name,
              publishedAt: item.pubDate,
              type: 'news',
              confidence: 'high'
            });
          }
        }
      } catch (error) {
        logError(`[Scout] Erro ao ler feed ${feed.name}`, error as Error);
      }
    }

    return results;
  }
}

export const scoutAgent = new ScoutAgent();
