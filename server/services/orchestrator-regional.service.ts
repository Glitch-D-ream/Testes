/**
 * Serviço de Orquestração Regional v2.0
 * Integra Scout Regional para cobertura de políticos em todos os níveis
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutRegional } from '../agents/scout-regional.ts';
import { filterAgent } from '../agents/filter.ts';
import { brainAgent } from '../agents/brain.ts';
import { getSupabase } from '../core/database.ts';

export class OrchestratorRegionalService {
  /**
   * Análise automática com Scout Regional
   */
  async autoAnalyzePolitician(
    politicianName: string,
    userId: string | null = null,
    context?: { office?: string; state?: string; city?: string; party?: string }
  ) {
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    logInfo(`[OrchestratorRegional] Iniciando análise para: ${politicianName}`);

    // Criar Job de Análise
    const analysisId = nanoid();
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `Análise regional iniciada para ${politicianName}`,
      status: 'processing',
      metadata: { searchContext: context }
    }]);

    // Execução Assíncrona
    setImmediate(async () => {
      try {
        logInfo(`[OrchestratorRegional] [Job:${analysisId}] Iniciando Tríade Regional para: ${politicianName}`);
        
        // FASE 1: Scout Regional - Busca inteligente por nível
        const searchContext = {
          name: politicianName,
          office: context?.office,
          state: context?.state,
          city: context?.city,
          party: context?.party
        };

        let rawSources = await scoutRegional.search(searchContext, false);
        logInfo(`[OrchestratorRegional] [Job:${analysisId}] Scout Regional encontrou ${rawSources.length} fontes`);
        
        // FASE 2: Deep Search se necessário
        if (rawSources.length < 2) {
          logWarn(`[OrchestratorRegional] [Job:${analysisId}] Poucos resultados (${rawSources.length}). Ativando Deep Search...`);
          const deepResults = await scoutRegional.search(searchContext, true);
          rawSources = [...rawSources, ...deepResults];
          logInfo(`[OrchestratorRegional] [Job:${analysisId}] Deep Search adicionou ${deepResults.length} fontes`);
        }
        
        if (rawSources.length === 0) {
          throw new Error(`Nenhuma fonte encontrada para "${politicianName}". Verifique o nome e tente novamente.`);
        }

        // FASE 3: Filter - Com modo flexível se necessário
        const useFlexibleMode = rawSources.length < 5;
        logInfo(`[OrchestratorRegional] [Job:${analysisId}] Filtrando ${rawSources.length} fontes (Modo: ${useFlexibleMode ? 'FLEXÍVEL' : 'RIGOROSO'})`);
        
        let filteredSources = await filterAgent.filter(rawSources, useFlexibleMode);
        
        if (filteredSources.length === 0 && !useFlexibleMode) {
          logWarn(`[OrchestratorRegional] [Job:${analysisId}] Nenhuma fonte passou no Filter rigoroso. Tentando modo flexível...`);
          filteredSources = await filterAgent.filter(rawSources, true);
        }
        
        if (filteredSources.length === 0) {
          throw new Error('Nenhuma promessa ou compromisso político foi detectado nos resultados encontrados.');
        }

        logInfo(`[OrchestratorRegional] [Job:${analysisId}] Filter selecionou ${filteredSources.length} fontes relevantes`);

        // FASE 4: Brain - Análise Profunda
        await brainAgent.analyze(politicianName, filteredSources, userId, analysisId);
        
        logInfo(`[OrchestratorRegional] [Job:${analysisId}] Análise regional concluída com sucesso.`);
      } catch (error: any) {
        logError(`[OrchestratorRegional] [Job:${analysisId}] Falha: ${error.message}`);
        await supabase.from('analyses').update({
          status: 'failed',
          error_message: error.message
        }).eq('id', analysisId);
      }
    });

    return { id: analysisId, status: 'processing' };
  }
}

export const orchestratorRegionalService = new OrchestratorRegionalService();
