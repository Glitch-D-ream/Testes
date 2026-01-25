
import { getSupabase, initializeDatabase } from './server/core/database.ts';
import dotenv from 'dotenv';

dotenv.config();

async function checkStatus() {
  await initializeDatabase();
  const { data, error } = await getSupabase()
    .from('analyses')
    .select('*')
    .ilike('id', 'test-analysis-%')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro ao buscar status:', error);
    return;
  }

  console.log('Última análise de teste encontrada:');
  console.log(JSON.stringify(data, null, 2));
}

checkStatus();
