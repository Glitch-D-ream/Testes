import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

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
      // Canal 1: Busca Web Inteligente (Pollinations/OpenAI)
      const webResults = await this.fetchFromWeb(query);
      sources.push(...webResults);
      
      // Canal 2: RSS Feeds de Notícias (Simulado para expansão futura)
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);
      
      logInfo(`[Scout] Varredura concluída. ${sources.length} fontes brutas encontradas.`);
      return sources;
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
   * Simulação de busca em RSS Feeds (Pode ser expandido para usar bibliotecas como 'rss-parser')
   */
  private async fetchFromRSS(query: string): Promise<RawSource[]> {
    // Em uma implementação futura, aqui conectaríamos com feeds do G1, Folha, etc.
    logInfo(`[Scout] Verificando RSS Feeds para ${query}...`);
    return []; 
  }
}

export const scoutAgent = new ScoutAgent();
