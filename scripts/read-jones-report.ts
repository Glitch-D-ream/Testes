
import { getSupabase, initializeDatabase } from '../server/core/database.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function readReport() {
  await initializeDatabase();
  const { data, error } = await getSupabase()
    .from('analyses')
    .select('*')
    .eq('politician_name', 'Jones Manoel')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Erro ao buscar análise:', error);
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📄 PARECER TÉCNICO COMPLETO: JONES MANOEL');
  console.log('='.repeat(60));
  console.log(data.text);
  console.log('='.repeat(60));
  
  process.exit(0);
}

readReport();
