/**
 * Scout Orchestrator v1.0 - GITHUB ACTIONS EDITION
 * 
 * Este script é projetado para rodar no GitHub Actions e orquestrar
 * todos os agentes Scout em paralelo, utilizando a CPU/IA local do Worker.
 */

import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { scoutCaseMiner } from '../agents/scout-case-miner.ts';
import { deepSocialMiner } from '../agents/deep-social-miner.ts';
import { jusBrasilAlternative } from '../integrations/jusbrasil-alternative.ts';
import { governmentPlanExtractorService } from '../services/government-plan-extractor.service.ts';
import { scoutInterviewAgent } from '../agents/scout-interview.ts';
import { scoutSpeechAgent } from '../agents/scout-speech.ts';
import { getPoliticalHistory } from '../integrations/tse.ts';
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function runOrchestrator() {
  const politicianName = process.env.POLITICIAN_NAME;
  const analysisId = process.env.ANALYSIS_ID;
  const state = process.env.POLITICIAN_STATE || 'Brasil';

  if (!politicianName || !analysisId) {
    logError(new Error('POLITICIAN_NAME e ANALYSIS_ID são obrigatórios.'));
    process.exit(1);
  }

  logInfo(`🚀 Iniciando Scout Orchestrator para: ${politicianName} (ID: ${analysisId})`);

  try {
    const supabase = getSupabase();

    // 1. Execução Paralela Massiva de todos os Scouts
    logInfo(`[Orchestrator] Disparando agentes de coleta em paralelo...`);
    
    const [
      rawSources, 
      caseEvidences, 
      governmentPromises, 
      interviewPromises, 
      speechPromises,
      socialEvidences,
      legalRecords,
      diarioRecords,
      tseHistory
    ] = await Promise.all([
      scoutHybrid.search(politicianName, true).catch(e => { logError(e); return []; }),
      scoutCaseMiner.mine(politicianName).catch(e => { logError(e); return []; }),
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(() => []),
      scoutInterviewAgent.searchAndExtract(politicianName).catch(() => []),
      scoutSpeechAgent.searchAndExtract(politicianName).catch(() => []),
      deepSocialMiner.mine(politicianName).catch(() => []),
      jusBrasilAlternative.searchLegalRecords(politicianName).catch(() => []),
      jusBrasilAlternative.searchQueridoDiario(politicianName).catch(() => []),
      getPoliticalHistory(politicianName, state).catch(() => null)
    ]);

    logInfo(`[Orchestrator] Coleta finalizada. Consolidando resultados...`);

    // 2. Consolidar e Salvar no Supabase (Bucket ou Tabela de Contexto)
    const scoutContext = {
      rawSources,
      caseEvidences,
      governmentPromises,
      interviewPromises,
      speechPromises,
      socialEvidences,
      legalRecords,
      diarioRecords,
      tseHistory,
      collectedAt: new Date().toISOString(),
      status: 'success'
    };

    // Atualizar a análise no Supabase com os dados coletados
    // Usamos o campo data_sources para armazenar o contexto pesado para o BrainAgent ler depois
    const { error } = await supabase
      .from('analyses')
      .update({
        data_sources: JSON.stringify(scoutContext),
        progress: 40, // Avança o progresso para a fase de análise
        text: 'Coleta multidimensional finalizada pelo Worker. Iniciando análise forense...'
      })
      .eq('id', analysisId);

    if (error) throw error;

    logInfo(`✅ Scout Orchestrator finalizado com sucesso. Dados persistidos para ID: ${analysisId}`);

  } catch (error: any) {
    logError(error);
    process.exit(1);
  }
}

runOrchestrator();
