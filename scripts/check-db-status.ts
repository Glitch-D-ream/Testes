import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function checkStatus() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Erro: Credenciais não configuradas');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('--- Status do Banco de Dados ---');

  // 1. Contagem de Promessas
  const { count: promiseCount } = await supabase.from('promises').select('*', { count: 'exact', head: true });
  console.log(`Total de Promessas: ${promiseCount}`);

  // 2. Contagem de Histórico do Scout
  const { count: scoutCount } = await supabase.from('scout_history').select('*', { count: 'exact', head: true });
  console.log(`Total de Notícias no Scout: ${scoutCount}`);

  // 3. Verificar Cache de Dados Públicos (SICONFI, etc)
  const { data: cacheData } = await supabase.from('public_data_cache').select('data_type, last_updated');
  console.log('\n--- Cache de Dados Públicos ---');
  if (cacheData && cacheData.length > 0) {
    cacheData.forEach(c => {
      console.log(`- ${c.data_type}: Última atualização em ${c.last_updated}`);
    });
  } else {
    console.log('Nenhum dado público em cache.');
  }

  // 4. Verificar se existem promessas com o novo campo news_title
  const { data: recentPromises } = await supabase.from('promises').select('id, news_title').limit(5);
  console.log('\n--- Amostra de Promessas (news_title) ---');
  recentPromises?.forEach(p => {
    console.log(`ID: ${p.id} | news_title: ${p.news_title || 'NULO'}`);
  });
}

checkStatus();
