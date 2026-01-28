
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function clearCache() {
  const supabase = getSupabase();
  logInfo('Limpando cache de análise para Erika Hilton...');
  const { error } = await supabase
    .from('analyses')
    .delete()
    .ilike('politician_name', '%Erika Hilton%');
  
  if (error) logError('Erro ao limpar cache:', error as Error);
  else logInfo('Cache limpo com sucesso!');
}

clearCache();
