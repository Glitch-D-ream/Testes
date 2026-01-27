
import { getSupabase, initializeDatabase } from '../core/database.ts';

async function inspect() {
  await initializeDatabase();
  const supabase = getSupabase();
  
  console.log('Buscando a última análise com data_sources não nulo...');
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .not('data_sources', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar dados:', error);
    return;
  }

  if (data) {
    console.log('ID da análise:', data.id);
    console.log('Político:', data.politician_name);
    console.log('\nConteúdo de data_sources:');
    console.log(JSON.stringify(data.data_sources, null, 2));
  } else {
    console.log('Nenhuma análise com data_sources encontrada.');
  }
}

inspect();
