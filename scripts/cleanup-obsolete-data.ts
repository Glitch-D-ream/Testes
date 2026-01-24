import { getSupabase } from '../server/core/database.js';
import { logInfo, logError } from '../server/core/logger.js';

async function cleanup() {
  const supabase = getSupabase();
  const name = 'Nikolas Ferreira';

  logInfo(`Iniciando limpeza de dados obsoletos para: ${name}`);

  try {
    // 1. Buscar IDs das análises do Nikolas
    const { data: analyses, error: fetchError } = await supabase
      .from('analyses')
      .select('id')
      .ilike('author', `%${name}%`);

    if (fetchError) throw fetchError;

    if (!analyses || analyses.length === 0) {
      logInfo('Nenhuma análise encontrada para limpar.');
      return;
    }

    const ids = analyses.map(a => a.id);
    logInfo(`Encontradas ${ids.length} análises para remover.`);

    // 2. Remover promessas vinculadas (Cascade manual se necessário)
    const { error: promisesError } = await supabase
      .from('promises')
      .delete()
      .in('analysis_id', ids);

    if (promisesError) logError('Erro ao remover promessas', promisesError as any);

    // 3. Remover as análises
    const { error: deleteError } = await supabase
      .from('analyses')
      .delete()
      .in('id', ids);

    if (deleteError) throw deleteError;

    logInfo('Limpeza concluída com sucesso. O sistema agora gerará uma análise 100% nova.');
  } catch (error) {
    logError('Falha na limpeza', error as Error);
  }
}

cleanup();
