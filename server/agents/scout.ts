import { ScoutAgent as SmartScoutAgent } from './scoutAgent.ts';
import { logInfo, logError } from '../core/logger.ts';

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
  private smartScout: SmartScoutAgent;

  constructor() {
    this.smartScout = new SmartScoutAgent();
  }

  async search(query: string, isDeepSearch: boolean = false): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando busca inteligente para: ${query}`);
    
    try {
      const results = await this.smartScout.execute(query);
      
      if (!results || !results.results) {
        return [];
      }

      return results.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        source: r.source,
        publishedAt: r.date,
        type: r.source === 'government' ? 'official' : 'news',
        confidence: r.metadata.relevance > 0.7 ? 'high' : 'medium'
      }));
    } catch (error: any) {
      logError(`[Scout] Erro na busca inteligente de ${query}`, error);
      return [];
    }
  }
}

export const scoutAgent = new ScoutAgent();
