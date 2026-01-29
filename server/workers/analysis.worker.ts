import { Job } from 'bull';
import { logInfo, logError } from '../core/logger.ts';
import { brainAgent } from '../agents/brain.ts';
import { getSupabase } from '../core/database.ts';

/**
 * AnalysisWorker v2.0 - O Coração Assíncrono do Seth VII
 * Este worker assume a responsabilidade de executar a auditoria completa
 * sem bloquear o servidor principal.
 */
export default async function analysisWorker(job: Job): Promise<any> {
  const { politicianName, userId, analysisId } = job.data;
  const supabase = getSupabase();

  logInfo(`[AnalysisWorker] 🧠 Iniciando Auditoria Forense para: ${politicianName} (Job: ${job.id})`);

  try {
    // 1. Atualizar progresso inicial
    if (analysisId) {
      await supabase.from('analyses').update({ 
        status: 'processing', 
        progress: 10,
        updated_at: new Date().toISOString()
      }).eq('id', analysisId);
    }

    // 2. Executar a análise pesada via BrainAgent
    // O BrainAgent já lida com Scout, Filter, Coerência e Consenso
    const result = await brainAgent.analyze(politicianName, userId, analysisId);

    // 3. O BrainAgent já salva no Supabase ao final, mas garantimos o status aqui
    if (analysisId) {
      await supabase.from('analyses').update({ 
        status: 'completed', 
        progress: 100,
        updated_at: new Date().toISOString()
      }).eq('id', analysisId);
    }

    logInfo(`[AnalysisWorker] ✅ Auditoria concluída com sucesso para: ${politicianName}`);
    return { success: true, analysisId };

  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido na auditoria';
    logError(`[AnalysisWorker] ❌ Falha crítica na auditoria de ${politicianName}:`, error);

    // Registrar falha no banco para o usuário não ficar no "carregamento infinito"
    if (analysisId) {
      await supabase.from('analyses').update({ 
        status: 'failed', 
        error_message: `Erro no processamento: ${errorMessage}`,
        updated_at: new Date().toISOString()
      }).eq('id', analysisId);
    }

    throw error; // Permite que o BullMQ gerencie tentativas (retries)
  }
}
