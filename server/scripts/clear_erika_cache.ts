
import { getSupabase } from '../core/database.ts';

async function clearCache() {
  const supabase = getSupabase();
  console.log('Limpando cache de análise para Erika Hilton...');
  const { error } = await supabase
    .from('analyses')
    .delete()
    .ilike('politician_name', '%Erika Hilton%');
  
  if (error) console.error('Erro ao limpar cache:', error);
  else console.log('Cache limpo com sucesso!');
}

clearCache();
