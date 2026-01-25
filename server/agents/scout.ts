import { scoutHybrid } from './scout-hybrid.ts';
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
  async search(query: string, isDeepSearch: boolean = false): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando busca híbrida para: ${query} (Deep: ${isDeepSearch})`);
    
    try {
      const results = await scoutHybrid.search(query, isDeepSearch);
      
      if (!results || results.length === 0) {
        return [];
      }

      return results.map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        source: r.source,
        publishedAt: r.publishedAt,
        type: r.source === 'government' ? 'official' : 'news',
        confidence: 'medium'
      }));
    } catch (error: any) {
      logError(`[Scout] Erro na busca híbrida de ${query}`, error);
      return [];
    }
  }
}

export const scoutAgent = new ScoutAgent();
