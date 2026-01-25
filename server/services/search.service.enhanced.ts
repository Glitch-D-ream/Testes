/**
 * Serviço de Busca Aprimorado com Contexto
 * Integra a busca contextualizada no fluxo de análise automática
 */

import { logInfo, logError } from '../core/logger.ts';
import { scoutAgent } from '../agents/scout.ts';
import { filterAgent } from '../agents/filter.ts';
import { brainAgent } from '../agents/brain.ts';
import { searchOptimizerContextual, ContextualSearchParams } from '../modules/search-optimizer-contextual.ts';
import { searchErrorHandler } from '../modules/search-error-handler.ts';

export class SearchServiceEnhanced {
  /**
   * Análise automática com contexto
   */
  async contextualAutoAnalyze(params: ContextualSearchParams, userId: string | null = null) {
    const { getSupabase } = await import('../core/database.js');
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    logInfo(`[SearchServiceEnhanced] Iniciando análise contextualizada: ${JSON.stringify(params)}`);

    // Criar Job de Análise
    const analysisId = nanoid();
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: params.name,
      text: `Análise contextualizada para ${params.name}${params.office ? ` (${params.office})` : ''}${params.state ? ` - ${params.state}` : ''}`,
      status: 'processing',
      metadata: {
        searchContext: params
      }
    }]);

    // Execução Assíncrona
    setImmediate(async () => {
      try {
        logInfo(`[SearchServiceEnhanced] [Job:${analysisId}] Iniciando busca contextualizada`);
        
        // Busca Contextualizada
        const searchResults = await searchOptimizerContextual.optimizedContextualSearch(params);
        
        if (searchResults.length === 0) {
          throw new Error(`Nenhum resultado encontrado para "${params.name}"${params.office ? ` (${params.office})` : ''}${params.state ? ` - ${params.state}` : ''}`);
        }

        logInfo(`[SearchServiceEnhanced] [Job:${analysisId}] ${searchResults.length} resultados encontrados`);

        // Converter resultados para formato de fontes brutas
        const rawSources = searchResults.map(result => ({
          title: result.name,
          url: result.url || `https://search-result/${nanoid()}`,
          content: `${result.office || ''} ${result.state || ''} ${result.party || ''}`.trim(),
          source: result.source,
          publishedAt: new Date().toISOString(),
          type: 'news' as const,
          confidence: result.confidence
        }));

        // Scout (já temos os resultados, mas podemos enriquecer)
        const enrichedSources = await scoutAgent.search(params.name);
        if (enrichedSources.length > 0) {
          rawSources.push(...enrichedSources);
        }

        // Filter
        const filteredSources = await filterAgent.filter(rawSources);
        if (filteredSources.length === 0) {
          throw new Error('Nenhuma promessa ou compromisso político claro foi detectado nos resultados encontrados.');
        }

        // Brain
        await brainAgent.analyze(params.name, filteredSources, userId, analysisId);
        
        logInfo(`[SearchServiceEnhanced] [Job:${analysisId}] Concluído com sucesso.`);
      } catch (error: any) {
        logError(`[SearchServiceEnhanced] [Job:${analysisId}] Falha: ${error.message}`);
        
        // Tratamento de erro
        const errorResponse = searchErrorHandler.handleSearchError({
          politicianName: params.name,
          error: error,
          attemptedStrategies: ['contextual_search', 'scout', 'filter'],
          resultsFound: 0
        });

        await supabase.from('analyses').update({
          status: 'failed',
          error_message: errorResponse.message,
          error_code: errorResponse.code
        }).eq('id', analysisId);
      }
    });

    return { id: analysisId, status: 'processing' };
  }

  /**
   * Busca com sugestões inteligentes
   */
  async searchWithSuggestions(params: ContextualSearchParams) {
    logInfo(`[SearchServiceEnhanced] Buscando com sugestões: ${JSON.stringify(params)}`);

    try {
      // Busca contextualizada
      const results = await searchOptimizerContextual.optimizedContextualSearch(params);

      // Agrupar por relevância
      const grouped = {
        high: results.filter(r => r.confidence === 'high' && r.relevance >= 80),
        medium: results.filter(r => r.confidence === 'medium' && r.relevance >= 60),
        low: results.filter(r => r.confidence === 'low' || r.relevance < 60)
      };

      return {
        found: results.length > 0,
        results: results.sort((a, b) => b.relevance - a.relevance),
        grouped,
        suggestions: this.generateSuggestions(params, results)
      };
    } catch (error) {
      logError('[SearchServiceEnhanced] Erro ao buscar com sugestões', error as Error);
      return {
        found: false,
        results: [],
        grouped: { high: [], medium: [], low: [] },
        suggestions: []
      };
    }
  }

  /**
   * Gera sugestões baseadas nos resultados
   */
  private generateSuggestions(params: ContextualSearchParams, results: any[]): string[] {
    const suggestions: string[] = [];

    if (results.length === 0) {
      suggestions.push(`Nenhum resultado encontrado para "${params.name}"`);
      
      if (!params.office) {
        suggestions.push('Tente adicionar o cargo (Deputado, Senador, Prefeito, etc)');
      }
      
      if (!params.state) {
        suggestions.push('Tente adicionar o estado (SP, RJ, MG, etc)');
      }
      
      if (!params.city) {
        suggestions.push('Se é um vereador ou prefeito, tente adicionar a cidade');
      }
    } else if (results.length < 3) {
      suggestions.push(`Apenas ${results.length} resultado(s) encontrado(s). Refine a busca adicionando mais contexto.`);
    } else {
      suggestions.push(`${results.length} resultados encontrados. Selecione o mais relevante.`);
    }

    return suggestions;
  }
}

export const searchServiceEnhanced = new SearchServiceEnhanced();
