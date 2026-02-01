/**
 * Scout Orchestrator v1.1 - PERFORMANCE & RELIABILITY
 * 
 * Otimizado para execução no GitHub Actions com progresso em tempo real.
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
import { logInfo, logError, logWarn } from '../core/logger.ts';

async function runOrchestrator() {
  const politicianName = process.env.POLITICIAN_NAME;
  const analysisId = process.env.ANALYSIS_ID;
  const state = process.env.POLITICIAN_STATE || 'Brasil';

  if (!politicianName || !analysisId) {
    logError(new Error('POLITICIAN_NAME e ANALYSIS_ID são obrigatórios.'));
    process.exit(1);
  }

  const supabase = getSupabase();
  const updateProgress = async (progress: number, text: string) => {
    logInfo(`[Orchestrator] [${progress}%] ${text}`);
    await supabase.from('analyses').update({ progress, text }).eq('id', analysisId);
  };

  logInfo(`🚀 Iniciando Scout Orchestrator para: ${politicianName}`);

  try {
    // 1. Grupo A: Fontes Oficiais e Histórico (Rápido)
    await updateProgress(15, "Minerando TSE, Planos de Governo e Histórico Político...");
    const [governmentPromises, tseHistory] = await Promise.all([
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(() => []),
      getPoliticalHistory(politicianName, state).catch(() => null)
    ]);

    // 2. Grupo B: Notícias e Casos (Médio - Pesado)
    await updateProgress(25, "Buscando notícias e evidências forenses profundas...");
    const [rawSources, caseEvidences] = await Promise.all([
      scoutHybrid.search(politicianName, true).catch(() => []),
      scoutCaseMiner.mine(politicianName).catch(() => [])
    ]);

    // 3. Grupo C: Social e Jurídico (Pesado)
    await updateProgress(35, "Analisando redes sociais e registros jurídicos...");
    const [socialEvidences, legalRecords, diarioRecords] = await Promise.all([
      deepSocialMiner.mine(politicianName).catch(() => []),
      jusBrasilAlternative.searchLegalRecords(politicianName).catch(() => []),
      jusBrasilAlternative.searchQueridoDiario(politicianName).catch(() => [])
    ]);

    // 4. Grupo D: Falas e Entrevistas
    await updateProgress(45, "Extraindo promessas de discursos e entrevistas...");
    const [interviewPromises, speechPromises] = await Promise.all([
      scoutInterviewAgent.searchAndExtract(politicianName).catch(() => []),
      scoutSpeechAgent.searchAndExtract(politicianName).catch(() => [])
    ]);

    // Consolidar Resultados
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

    await supabase.from('analyses').update({
      data_sources: JSON.stringify(scoutContext),
      progress: 50,
      text: 'Coleta finalizada. Iniciando cruzamento de dados e veredito...'
    }).eq('id', analysisId);

    logInfo(`✅ Scout Orchestrator finalizado com sucesso.`);

  } catch (error: any) {
    logError(error);
    await supabase.from('analyses').update({
      status: 'error',
      text: `Falha na coleta do Orchestrator: ${error.message}`
    }).eq('id', analysisId);
    process.exit(1);
  }
}

runOrchestrator();
