
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function applySql() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Erro: Credenciais Supabase não configuradas no .env');
    return;
  }

  console.log('🚀 Conectando ao Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const sqlFile = './create_scout_history.sql';
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('📝 Tentando aplicar SQL via RPC (exec_sql)...');
  
  // Nota: O Supabase não permite execução de SQL arbitrário via SDK por padrão por segurança.
  // É necessário ter uma função RPC 'exec_sql' criada ou usar o painel SQL do Supabase.
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Erro ao executar via RPC:', error.message);
    console.log('\n💡 DICA: O Supabase SDK não permite CREATE TABLE diretamente por segurança.');
    console.log('✅ Por favor, copie o conteúdo de "create_scout_history.sql" e cole no SQL Editor do painel do Supabase.');
  } else {
    console.log('✅ SQL aplicado com sucesso!');
  }
}

applySql();
