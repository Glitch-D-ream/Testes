/**
 * Super Orchestrator v2.0 - TURBO PARALLEL INTELLIGENCE
 * 
 * Otimizado para execução em paralelo total de todas as fontes de dados.
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

  // Retry logic para buscar a análise (evitar erro de sincronismo)
  let analysis = null;
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.from('analyses').select('*').eq('id', analysisId).single();
    if (data) {
      analysis = data;
      break;
    }
    logWarn(`[Super-Worker] Tentativa ${i + 1}/5: Análise ${analysisId} não encontrada. Aguardando...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!analysis) {
    logError(new Error(`Análise ${analysisId} não encontrada no Supabase após 5 tentativas.`));
    process.exit(1);
  }

  const updateProgress = async (progress: number, text: string) => {
    logInfo(`[Super-Worker] [${progress}%] ${text}`);
    await supabase.from('analyses').update({ progress, text }).eq('id', analysisId);
  };

  logInfo(`🚀 Iniciando Super-Orchestrator TURBO para: ${politicianName}`);

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // FASE 1: COLETA MULTIDIMENSIONAL RADICAL (PARALELISMO TOTAL)
    // ═══════════════════════════════════════════════════════════════════════
    await updateProgress(10, "Iniciando Coleta Multidimensional Radical (Turbo Mode)...");
    
    logInfo(`[Super-Worker] Disparando todos os agentes de coleta simultaneamente...`);
    
    const startTime = Date.now();

    // MODO PROFUNDO: Restaurando todas as fontes oficiais e cruzamentos
    logInfo(`[Super-Worker] Iniciando coleta multidimensional profunda...`);
    
    const [
      governmentPromises, 
      tseHistory,
      rawSources, 
      caseEvidences,
      socialEvidences, 
      legalRecords, 
      diarioRecords,
      interviewPromises, 
      speechPromises
    ] = await Promise.all([
      governmentPlanExtractorService.extractFromTSE(politicianName, state, 2022).catch(e => { logWarn(`Erro GovPlan: ${e.message}`); return []; }),
      getPoliticalHistory(politicianName, state).catch(e => { logWarn(`Erro TSE: ${e.message}`); return null; }),
      scoutHybrid.search(politicianName, true).catch(e => { logWarn(`Erro Scout: ${e.message}`); return []; }),
      scoutCaseMiner.mine(politicianName).catch(e => { logWarn(`Erro CaseMiner: ${e.message}`); return []; }),
      deepSocialMiner.mine(politicianName).catch(e => { logWarn(`Erro Social: ${e.message}`); return []; }),
      jusBrasilAlternative.searchLegalRecords(politicianName).catch(e => { logWarn(`Erro Legal: ${e.message}`); return []; }),
      jusBrasilAlternative.searchQueridoDiario(politicianName).catch(e => { logWarn(`Erro Diario: ${e.message}`); return []; }),
      scoutInterviewAgent.searchAndExtract(politicianName).catch(e => { logWarn(`Erro Interview: ${e.message}`); return []; }),
      scoutSpeechAgent.searchAndExtract(politicianName).catch(e => { logWarn(`Erro Speech: ${e.message}`); return []; })
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logInfo(`[Super-Worker] Coleta finalizada em ${duration}s.`);

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

    logInfo(`[Super-Worker] Executando BrainAgent.finalizeAnalysis na nuvem...`);
    const finalResult = await brainAgent.finalizeAnalysis(analysisId, scoutData);

    // ═══════════════════════════════════════════════════════════════════════
    // FASE 3: ESTRUTURAÇÃO E CONCLUSÃO
    // ═══════════════════════════════════════════════════════════════════════
    await updateProgress(90, "Finalizando dossiê e estruturando relatórios...");

    await supabase.from('analyses').update({
      ai_verdict_local: {
        engine: 'Dual-Chain Super-Worker v2.0 (Turbo)',
        processed_at: new Date().toISOString(),
        confidence: finalResult.consensusMetrics?.consensusScore || 70,
        summary: finalResult.humanizedReport.substring(0, 500),
        duration_scout: `${duration}s`
      }
    }).eq('id', analysisId);

    await updateProgress(100, "Análise forense concluída com sucesso!");
    logInfo(`✅ Super-Orchestrator TURBO finalizado para ${politicianName}.`);

  } catch (error: any) {
    logError(error);
    await supabase.from('analyses').update({
      status: 'error',
      text: `Falha crítica no Super-Worker Turbo: ${error.message}`
    }).eq('id', analysisId);
    process.exit(1);
  }
}

runSuperOrchestrator();
