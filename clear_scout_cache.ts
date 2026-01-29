import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache() {
  console.log('Limpando cache para Erika Hilton no Supabase...');
  
  // 1. Limpar scout_history
  const { error: error1 } = await supabase
    .from('scout_history')
    .delete()
    .ilike('politician_name', '%Erika Hilton%');

  if (error1) console.error('Erro ao limpar scout_history:', error1.message);
  else console.log('scout_history limpo.');

  // 2. Limpar data_snapshots (se existir)
  const { error: error2 } = await supabase
    .from('data_snapshots')
    .delete()
    .like('data_source', 'cache:search:%Erika Hilton%');

  if (error2) console.log('Aviso ao limpar data_snapshots (pode não existir):', error2.message);
  else console.log('data_snapshots limpo.');
}

clearCache();
