import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
}

export class ScoutAgent {
  /**
   * Busca notícias e falas usando múltiplas fontes
   */
  async search(query: string): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando varredura para: ${query}`);
    
    const sources: RawSource[] = [];
    
    try {
      // Fonte 1: Pollinations (Simulando busca web inteligente)
      const webResults = await this.fetchFromWeb(query);
      sources.push(...webResults);
      
      logInfo(`[Scout] Varredura concluída. ${sources.length} fontes brutas encontradas.`);
      return sources;
    } catch (error) {
      logError(`[Scout] Erro na varredura de ${query}`, error as Error);
      return [];
    }
  }

  private async fetchFromWeb(query: string): Promise<RawSource[]> {
    const prompt = `Liste as 5 notícias ou falas mais recentes e importantes do político "${query}" sobre promessas, obras ou planos. 
    Retorne um array JSON: [{"title": "string", "url": "string", "content": "string", "source": "string"}]`;

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
      source: item.source
    }));
  }
}

export const scoutAgent = new ScoutAgent();
