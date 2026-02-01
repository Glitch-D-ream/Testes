/**
 * Super Orchestrator v1.0 - UNIFIED CLOUD INTELLIGENCE
 * 
 * Este script unifica a coleta (Scout) e o processamento de IA (Dual-Chain)
 * em um único fluxo de execução no GitHub Actions.
 */

import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { scoutCaseMiner } from '../agents/scout-case-miner.ts';
import { deepSocialMiner } from '../agents/deep-social-miner.ts';
import { jusBrasilAlternative } from '../integrations/jusbrasil-alternative.ts';
import { governmentPlanExtractorService } from '../services/government-plan-extractor.service.ts';
import { scoutInterviewAgent } from '../agents/scout-interview.ts';
import { scoutSpeechAgent } from '../agents/scout-speech.ts';
import { getPoliticalHistory } from '../integrations/tse.ts';
import { brainAgent } from '../agents/brain.ts';
import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';

async function runSuperOrchestrator() {
  const politicianName = process.env.POLITICIAN_NAME;
  const analysisId = process.env.ANALYSIS_ID;
  const state = process.env.POLITICIAN_STATE || 'Brasil';

  if (!politicianName || !analysisId) {
    logError(new Error('POLITICIAN_NAME e ANALYSIS_ID são obrigatórios para o Super-Orchestrator.'));
    process.exit(1);
  }

  const supabase = getSupabase();
  const updateProgress = async (progress: number, text: string) => {
    logInfo(`[Super-Worker] [${progress}%] ${text}`);
    await supabase.from('analyses').update({ progress, text }).eq('id', analysisId);
  };

  logInfo(`🚀 Iniciando Super-Orchestrator (Coleta + IA) para: ${politicianName}`);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // FASE 1: COLETA MULTIDIMENSIONAL (SCOUT)
    // ═══════════════════════════════════════════════════════════════════════
    await updateProgress(10, "Minerando dados oficiais (TSE e Planos de Governo)...");
    const [governmentPromises, tseHistory] = await Promise.all([
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(() => []),
      getPoliticalHistory(politicianName, state).catch(() => null)
    ]);

    await updateProgress(25, "Buscando notícias e evidências forenses profundas...");
    const [rawSources, caseEvidences] = await Promise.all([
      scoutHybrid.search(politicianName, true).catch(() => []),
      scoutCaseMiner.mine(politicianName).catch(() => [])
    ]);

    await updateProgress(40, "Analisando redes sociais e registros jurídicos...");
    const [socialEvidences, legalRecords, diarioRecords] = await Promise.all([
      deepSocialMiner.mine(politicianName).catch(() => []),
      jusBrasilAlternative.searchLegalRecords(politicianName).catch(() => []),
      jusBrasilAlternative.searchQueridoDiario(politicianName).catch(() => [])
    ]);

    await updateProgress(55, "Extraindo promessas de falas e entrevistas...");
    const [interviewPromises, speechPromises] = await Promise.all([
      scoutInterviewAgent.searchAndExtract(politicianName).catch(() => []),
      scoutSpeechAgent.searchAndExtract(politicianName).catch(() => [])
    ]);

    // ═══════════════════════════════════════════════════════════════════════
    // FASE 2: PROCESSAMENTO DE IA E VEREDITO (DUAL-CHAIN)
    // ═══════════════════════════════════════════════════════════════════════
    await updateProgress(70, "Iniciando Raciocínio Forense Profundo (Dual-Chain IA)...");
    
    const scoutData = {
      rawSources,
      caseEvidences,
      governmentPromises,
      interviewPromises,
      speechPromises,
      socialEvidences,
      legalRecords,
      diarioRecords,
      tseHistory,
      status: 'success'
    };

    // Chamar a lógica de finalização do BrainAgent diretamente no Worker
    logInfo(`[Super-Worker] Executando BrainAgent.finalizeAnalysis na nuvem...`);
    const finalResult = await brainAgent.finalizeAnalysis(analysisId, scoutData);

    // ═══════════════════════════════════════════════════════════════════════
    // FASE 3: ESTRUTURAÇÃO E CONCLUSÃO
    // ═══════════════════════════════════════════════════════════════════════
    await updateProgress(90, "Finalizando dossiê e estruturando relatórios...");

    // Adicionar o carimbo da Dual-Chain local
    await supabase.from('analyses').update({
      ai_verdict_local: {
        engine: 'Dual-Chain Super-Worker (GitHub Actions)',
        processed_at: new Date().toISOString(),
        confidence: finalResult.consensusMetrics?.consensusScore || 70,
        summary: finalResult.humanizedReport.substring(0, 500)
      }
    }).eq('id', analysisId);

    await updateProgress(100, "Análise forense concluída com sucesso!");
    logInfo(`✅ Super-Orchestrator finalizado para ${politicianName}.`);

  } catch (error: any) {
    logError(error);
    await supabase.from('analyses').update({
      status: 'error',
      text: `Falha crítica no Super-Worker: ${error.message}`
    }).eq('id', analysisId);
    process.exit(1);
  }
}

runSuperOrchestrator();
