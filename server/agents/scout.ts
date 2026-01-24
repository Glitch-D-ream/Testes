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
}

export class ScoutAgent {
  /**
   * Busca notícias e falas usando múltiplas fontes
   */
  async search(query: string): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando varredura multicanal para: ${query}`);
    
    const sources: RawSource[] = [];
    
    try {
      // Canal 1: RSS Feeds de Notícias (Gratuito e em Tempo Real)
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);

      // Canal 2: Busca Web Inteligente (Pollinations/OpenAI) - Apenas se necessário
      if (sources.length < 3) {
        const webResults = await this.fetchFromWeb(query);
        sources.push(...webResults);
      }
      
      // Filtrar URLs já conhecidas e salvar novas no banco (Persistência)
      const newSources: RawSource[] = [];
      for (const source of sources) {
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
      
      logInfo(`[Scout] Varredura concluída. ${newSources.length} novas fontes encontradas.`);
      return newSources;
    } catch (error) {
      logError(`[Scout] Erro na varredura de ${query}`, error as Error);
      return [];
    }
  }

  private async fetchFromWeb(query: string): Promise<RawSource[]> {
    const prompt = `Liste as 5 notícias ou falas mais recentes e importantes do político "${query}" sobre promessas, obras ou planos. 
    Retorne um array JSON: [{"title": "string", "url": "string", "content": "string", "source": "string", "date": "string"}]`;

    try {
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'Você é um buscador de notícias políticas. Retorne apenas JSON.' },
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
        content: item.content || item.snippet,
        source: item.source,
        publishedAt: item.date,
        type: 'news'
      }));
    } catch (error) {
      logError('[Scout] Falha ao buscar na Web', error as Error);
      return [];
    }
  }

  /**
   * Busca em RSS Feeds públicos de grandes portais brasileiros
   */
  private async fetchFromRSS(query: string): Promise<RawSource[]> {
    logInfo(`[Scout] Verificando RSS Feeds para ${query}...`);
    
    // Feeds populares no Brasil que aceitam busca ou são gerais
    const feeds = [
      { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
      { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
      { name: 'Estadão Política', url: 'https://politica.estadao.com.br/rss/' }
    ];

    const results: RawSource[] = [];
    const queryLower = query.toLowerCase();

    for (const feed of feeds) {
      try {
        // Usando um serviço gratuito de conversão de RSS para JSON para facilitar o parsing sem dependências pesadas
        // Alternativamente, poderíamos usar 'rss-parser' se instalado.
        const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, { timeout: 10000 });
        
        if (response.data && response.data.items) {
          const matchedItems = response.data.items.filter((item: any) => 
            item.title.toLowerCase().includes(queryLower) || 
            item.description.toLowerCase().includes(queryLower)
          );

          for (const item of matchedItems) {
            results.push({
              title: item.title,
              url: item.link,
              content: item.description || item.content,
              source: feed.name,
              publishedAt: item.pubDate,
              type: 'news'
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
