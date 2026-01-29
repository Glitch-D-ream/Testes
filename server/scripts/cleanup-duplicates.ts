
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function cleanupDuplicates() {
  const supabase = getSupabase();
  logInfo('🚀 Iniciando limpeza de análises duplicadas...');

  // 1. Buscar todas as análises agrupadas por autor e data aproximada
  const { data: analyses, error } = await supabase
    .from('analyses')
    .select('id, author, created_at, status')
    .order('author', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    logError('Erro ao buscar análises para limpeza', error);
    return;
  }

  if (!analyses || analyses.length === 0) {
    logInfo('Nenhuma análise encontrada para limpar.');
    return;
  }

  const toDelete: string[] = [];
  const seen = new Map<string, number>(); // author -> lastTimestamp

  analyses.forEach((analysis) => {
    if (!analysis.author) return;

    const timestamp = new Date(analysis.created_at).getTime();
    const lastTimestamp = seen.get(analysis.author);

    // Se vimos esse autor nos últimos 10 minutos, é uma duplicata provável
    if (lastTimestamp && Math.abs(lastTimestamp - timestamp) < 10 * 60 * 1000) {
      toDelete.push(analysis.id);
      logInfo(`[Cleanup] Marcando duplicata: ${analysis.author} (ID: ${analysis.id})`);
    } else {
      seen.set(analysis.author, timestamp);
    }
  });

  if (toDelete.length > 0) {
    logInfo(`[Cleanup] Removendo ${toDelete.length} duplicatas...`);
    
    // Deletar em blocos de 50 para evitar limites de URL/Query
    for (let i = 0; i < toDelete.length; i += 50) {
      const chunk = toDelete.slice(i, i + 50);
      const { error: delError } = await supabase
        .from('analyses')
        .delete()
        .in('id', chunk);
      
      if (delError) {
        logError(`Erro ao deletar bloco ${i}`, delError);
      }
    }
    logInfo('✅ Limpeza concluída com sucesso!');
  } else {
    logInfo('Nenhuma duplicata detectada.');
  }
}

cleanupDuplicates().catch(console.error);
