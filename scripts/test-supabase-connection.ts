import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function testConnection() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Erro: SUPABASE_URL ou SUPABASE_KEY não configurados no .env');
    process.exit(1);
  }

  console.log(`Conectando ao Supabase em: ${SUPABASE_URL}`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Tentar buscar dados de uma tabela comum para verificar conexão
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao conectar ou acessar tabela "users":', error.message);
      console.log('Isso pode significar que a tabela ainda não existe.');
    } else {
      console.log('Conexão bem-sucedida! Tabela "users" acessível.');
    }

    // Tentar listar outras tabelas importantes
    const tables = ['promises', 'scout_history', 'public_data_cache', 'audit_logs'];
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (tableError) {
        console.log(`Tabela "${table}": Não encontrada ou erro (${tableError.message})`);
      } else {
        console.log(`Tabela "${table}": Encontrada e acessível.`);
      }
    }

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

testConnection();
