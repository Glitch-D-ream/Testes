import { getSupabase } from '../server/core/database.js';
import { logInfo, logError } from '../server/core/logger.js';

async function cleanupScout() {
  const supabase = getSupabase();
  const name = 'Nikolas Ferreira';

  logInfo(`Limpando histórico de busca (Scout) para: ${name}`);

  try {
    const { error } = await supabase
      .from('scout_history')
      .delete()
      .ilike('politician_name', `%${name}%`);

    if (error) throw error;

    logInfo('Histórico de busca limpo. O Scout agora tratará as notícias como novas.');
  } catch (error) {
    logError('Falha na limpeza do Scout', error as Error);
  }
}

cleanupScout();
