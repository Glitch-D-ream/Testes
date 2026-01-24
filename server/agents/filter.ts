import { RawSource } from './scout.js';
import { logInfo } from '../core/logger.js';

export interface FilteredSource extends RawSource {
  relevanceScore: number;
  isPromise: boolean;
}

export class FilterAgent {
  /**
   * Filtra e limpa os dados brutos do Scout
   */
  async filter(sources: RawSource[]): Promise<FilteredSource[]> {
    logInfo(`[Filter] Processando ${sources.length} fontes brutas...`);
    
    // 1. Remover duplicatas por URL
    const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    
    // 2. Filtrar por palavras-chave de promessa (Heurística rápida)
    const promiseKeywords = [
      'vou', 'vamos', 'prometo', 'farei', 'construir', 'projeto', 
      'plano', 'investimento', 'reduzir', 'aumentar', 'garantir'
    ];

    const filtered = uniqueSources.map(source => {
      const contentLower = source.content.toLowerCase();
      const hasKeywords = promiseKeywords.some(kw => contentLower.includes(kw));
      
      return {
        ...source,
        relevanceScore: hasKeywords ? 0.8 : 0.3,
        isPromise: hasKeywords
      };
    });

    // Retornar apenas o que parece relevante
    const results = filtered.filter(f => f.isPromise);
    logInfo(`[Filter] Refino concluído. ${results.length} fontes relevantes identificadas.`);
    
    return results;
  }
}

export const filterAgent = new FilterAgent();
();
 = new FilterAgent();
