/**
 * Serviço de Orquestração da Tríade com Deep Search Automático
 * Gerencia o fluxo Scout -> Filter -> Brain com fallbacks inteligentes
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutAgent } from '../agents/scout.ts';
import { filterAgent } from '../agents/filter.ts';
import { BrainAgent } from '../agents/brain.ts';
import { getSupabase } from '../core/database.ts';

export class OrchestratorService {
  /**
   * Análise automática com Deep Search inteligente
   */
  async autoAnalyzePolitician(politicianName: string, userId: string | null = null) {
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    logInfo(`[Orchestrator] Iniciando análise para: ${politicianName}`);

    // Criar Job de Análise
    const analysisId = nanoid();
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `Análise automática iniciada para ${politicianName}`,
      status: 'processing'
    }]);

    // Execução Assíncrona
    setImmediate(async () => {
      try {
        logInfo(`[Orchestrator] [Job:${analysisId}] Iniciando Tríade para: ${politicianName}`);
        
        // FASE 1: Scout - Busca Inicial (Sempre Deep para garantir qualidade)
        let rawSources = await scoutAgent.search(politicianName, true);
        logInfo(`[Orchestrator] [Job:${analysisId}] Scout encontrou ${rawSources.length} fontes`);
        
        if (rawSources.length === 0) {
          throw new Error(`Nenhuma fonte encontrada para "${politicianName}". Tente adicionar contexto (cargo, estado) ou verificar o nome.`);
        }

        // FASE 3: Filter - Com modo flexível se necessário
        const useFlexibleMode = rawSources.length < 5;
        logInfo(`[Orchestrator] [Job:${analysisId}] Filtrando ${rawSources.length} fontes (Modo: ${useFlexibleMode ? 'FLEXÍVEL' : 'RIGOROSO'})`);
        
        let filteredSources = await filterAgent.filter(rawSources, useFlexibleMode);
        
        if (filteredSources.length === 0 && !useFlexibleMode) {
          // Tentar novamente com modo flexível
          logWarn(`[Orchestrator] [Job:${analysisId}] Nenhuma fonte passou no Filter rigoroso. Tentando modo flexível...`);
          filteredSources = await filterAgent.filter(rawSources, true);
        }
        
        if (filteredSources.length === 0) {
          throw new Error('Nenhuma promessa ou compromisso político foi detectado nos resultados encontrados.');
        }

        logInfo(`[Orchestrator] [Job:${analysisId}] Filter selecionou ${filteredSources.length} fontes relevantes`);

        // FASE 4: Brain - Análise Profunda
        const brainAgent = new BrainAgent();
        await brainAgent.analyze(politicianName, filteredSources, userId, analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] Análise concluída com sucesso.`);
      } catch (error: any) {
        logError(`[Orchestrator] [Job:${analysisId}] Falha: ${error.message}`);
        await supabase.from('analyses').update({
          status: 'failed',
          error_message: error.message
        }).eq('id', analysisId);
      }
    });

    return { id: analysisId, status: 'processing' };
  }

  /**
   * Análise com contexto (cargo, estado, cidade)
   */
  async autoAnalyzePoliticianContextual(
    politicianName: string,
    context: { office?: string; state?: string; city?: string; party?: string },
    userId: string | null = null
  ) {
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    const contextStr = [context.office, context.state, context.city, context.party]
      .filter(Boolean)
      .join(' ');
    
    logInfo(`[Orchestrator] Análise contextualizada: ${politicianName} (${contextStr})`);

    const analysisId = nanoid();
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `Análise contextualizada para ${politicianName} - ${contextStr}`,
      status: 'processing',
      metadata: { searchContext: context }
    }]);

    setImmediate(async () => {
      try {
        // Construir query contextualizada
        const query = [politicianName, context.office, context.state, context.city]
          .filter(Boolean)
          .join(' ');

        logInfo(`[Orchestrator] [Job:${analysisId}] Buscando com contexto: ${query}`);
        
        let rawSources = await scoutAgent.search(query, false);
        
        if (rawSources.length < 2) {
          logWarn(`[Orchestrator] [Job:${analysisId}] Ativando Deep Search contextualizado...`);
          const deepResults = await scoutAgent.search(query, true);
          rawSources = [...rawSources, ...deepResults];
        }
        
        if (rawSources.length === 0) {
          throw new Error(`Nenhuma fonte encontrada para "${politicianName}" com os critérios fornecidos.`);
        }

        const useFlexibleMode = rawSources.length < 5;
        let filteredSources = await filterAgent.filter(rawSources, useFlexibleMode);
        
        if (filteredSources.length === 0 && !useFlexibleMode) {
          filteredSources = await filterAgent.filter(rawSources, true);
        }
        
        if (filteredSources.length === 0) {
          throw new Error('Nenhuma promessa foi detectada nos resultados.');
        }

        const brainAgent = new BrainAgent();
        await brainAgent.analyze(politicianName, filteredSources, userId, analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] Análise contextualizada concluída.`);
      } catch (error: any) {
        logError(`[Orchestrator] [Job:${analysisId}] Falha: ${error.message}`);
        await supabase.from('analyses').update({
          status: 'failed',
          error_message: error.message
        }).eq('id', analysisId);
      }
    });

    return { id: analysisId, status: 'processing' };
  }
}

export const orchestratorService = new OrchestratorService();
