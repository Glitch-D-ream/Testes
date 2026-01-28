
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';

export interface FilteredSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official' | 'document';
  confidence: 'high' | 'medium' | 'low';
  credibilityLayer: 'A' | 'B' | 'C';
  shouldIngestFull?: boolean; // Novo: indica se deve fazer ingestão profunda
}

export class FilterAgentOptimized {
  /**
   * Classifica snippets rapidamente para decidir se vale a pena fazer ingestão profunda
   */
  async classifySnippet(title: string, snippet: string, source: string): Promise<{ shouldIngest: boolean; confidence: number }> {
    logInfo(`[FilterOptimized] Classificando snippet: ${title.substring(0, 50)}...`);
    
    const prompt = `
      Analise este snippet de notícia e determine se ele é relevante para uma auditoria forense política.
      
      Título: ${title}
      Resumo: ${snippet}
      Fonte: ${source}
      
      Responda APENAS JSON:
      {
        "relevant": true/false,
        "confidence": 0.0 a 1.0,
        "reason": "Por que é/não é relevante"
      }
    `;

    try {
      const response = await aiResilienceNexus.chatJSON<{ relevant: boolean; confidence: number; reason: string }>(prompt);
      return {
        shouldIngest: response.relevant && response.confidence > 0.6,
        confidence: response.confidence
      };
    } catch (error) {
      logWarn(`[FilterOptimized] Erro na classificação. Usando heurística...`);
      // Fallback heurístico
      const keywords = ['transparência', 'corrupção', 'emenda', 'orçamento', 'voto', 'promessa', 'contradição', 'investigação'];
      const hasKeyword = keywords.some(k => title.toLowerCase().includes(k) || snippet.toLowerCase().includes(k));
      return { shouldIngest: hasKeyword, confidence: hasKeyword ? 0.7 : 0.3 };
    }
  }

  /**
   * Filtra um conjunto de resultados brutos, priorizando ingestão profunda apenas para relevantes
   */
  async filter(rawSources: any[], useFlexibleMode: boolean = false): Promise<FilteredSource[]> {
    logInfo(`[FilterOptimized] Filtrando ${rawSources.length} fontes com priorização inteligente...`);
    
    const filtered: FilteredSource[] = [];

    for (const source of rawSources) {
      try {
        // Se é oficial (Camada A), sempre ingere profundo
        if (source.credibilityLayer === 'A' || source.type === 'official') {
          logInfo(`[FilterOptimized] Camada A detectada. Marcando para ingestão profunda: ${source.title}`);
          filtered.push({
            ...source,
            shouldIngestFull: true
          });
          continue;
        }

        // Para Camada B/C, fazer triagem rápida
        const classification = await this.classifySnippet(source.title, source.description || source.snippet || '', source.source);
        
        if (classification.shouldIngest) {
          logInfo(`[FilterOptimized] Snippet relevante (${(classification.confidence * 100).toFixed(0)}%). Marcando para ingestão profunda.`);
          filtered.push({
            ...source,
            shouldIngestFull: true,
            confidence: classification.confidence > 0.8 ? 'high' : 'medium'
          });
        } else {
          logWarn(`[FilterOptimized] Snippet descartado (confiança: ${(classification.confidence * 100).toFixed(0)}%)`);
        }
      } catch (error) {
        logError(`[FilterOptimized] Erro ao filtrar ${source.title}:`, error as Error);
      }
    }

    logInfo(`[FilterOptimized] Filtragem concluída. ${filtered.length} de ${rawSources.length} fontes selecionadas para ingestão.`);
    return filtered;
  }
}

export const filterAgentOptimized = new FilterAgentOptimized();
