
import { getSupabase, initializeDatabase } from '../core/database.ts';

async function inspect() {
  await initializeDatabase();
  const supabase = getSupabase();
  
  console.log('Buscando a última análise para inspecionar estrutura...');
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar dados:', error);
    return;
  }

  if (data) {
    console.log('Colunas disponíveis na tabela analyses:');
    console.log(Object.keys(data).join(', '));
    console.log('\nConteúdo de data_sources:');
    console.log(JSON.stringify(data.data_sources, null, 2));
  } else {
    console.log('Nenhuma análise encontrada na tabela.');
  }
}

inspect();
