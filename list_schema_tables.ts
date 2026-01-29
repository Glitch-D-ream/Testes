import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const tables = [
    'users', 'politicians', 'analyses', 'promises', 
    'audit_logs', 'consents', 'public_data_cache', 
    'evidence_storage', 'audit_contributions', 'scout_history'
  ];

  console.log('Verificando tabelas do schema no Supabase...');
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ Tabela [${table}]: Não encontrada ou erro (${error.message})`);
    } else {
      console.log(`✅ Tabela [${table}]: Acessível.`);
    }
  }
}

listTables();
