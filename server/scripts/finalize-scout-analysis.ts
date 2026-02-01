/**
 * Finalize Scout Analysis v1.0
 * 
 * Este script é chamado pelo GitHub Actions após a coleta para
 * processar os dados e finalizar a análise no Supabase.
 */

import { brainAgent } from '../agents/brain.ts';
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function finalize() {
  const analysisId = process.env.ANALYSIS_ID;
  
  if (!analysisId) {
    logError(new Error('ANALYSIS_ID é obrigatório para finalização.'));
    process.exit(1);
  }

  logInfo(`🏁 Finalizando análise para ID: ${analysisId}`);

  try {
    const supabase = getSupabase();
    
    // 1. Recuperar os dados coletados do campo data_sources
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('data_sources')
      .eq('id', analysisId)
      .single();

    if (fetchError || !analysis?.data_sources) {
      throw new Error(`Dados de coleta não encontrados para ID: ${analysisId}`);
    }

    const scoutData = JSON.parse(analysis.data_sources);
    
    if (scoutData.status !== 'success') {
      throw new Error(`A coleta do Scout Orchestrator não foi bem-sucedida.`);
    }

    // 2. Chamar o finalizador do BrainAgent
    await brainAgent.finalizeAnalysis(analysisId, scoutData);

    logInfo(`✅ Análise finalizada com sucesso para ID: ${analysisId}`);

  } catch (error: any) {
    logError(error);
    process.exit(1);
  }
}

finalize();
