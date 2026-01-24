
import { getSupabase } from './server/core/database.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  console.log('🔗 Testando conexão com Supabase Real...');
  
  try {
    const supabase = getSupabase();
    
    // 1. Testar conexão básica
    const { data: tables, error: tablesError } = await supabase
      .from('analyses')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Erro ao conectar ou acessar tabela "analyses":', tablesError.message);
      console.log('💡 Verifique se as tabelas foram criadas no Supabase.');
    } else {
      console.log('✅ Conexão estabelecida e tabela "analyses" acessível.');
    }

    // 2. Verificar se a nova tabela scout_history existe
    const { error: scoutError } = await supabase
      .from('scout_history')
      .select('id')
      .limit(1);

    if (scoutError) {
      if (scoutError.code === '42P01') {
        console.error('❌ A tabela "scout_history" NÃO existe no banco de dados.');
        console.log('💡 Você precisa criar a tabela no painel do Supabase ou rodar as migrações.');
      } else {
        console.error('❌ Erro ao acessar "scout_history":', scoutError.message);
      }
    } else {
      console.log('✅ Tabela "scout_history" encontrada e pronta para uso.');
    }

    // 3. Verificar public_data_cache
    const { error: cacheError } = await supabase
      .from('public_data_cache')
      .select('id')
      .limit(1);

    if (cacheError) {
      console.error('❌ Erro ao acessar "public_data_cache":', cacheError.message);
    } else {
      console.log('✅ Tabela "public_data_cache" encontrada.');
    }

  } catch (error: any) {
    console.error('💥 Erro fatal no teste do Supabase:', error.message);
  }
}

testSupabase();
