import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('Listando tabelas via API RPC/REST...');
  
  // Tentar listar tabelas via query direta no schema public
  const { data, error } = await supabase
    .from('scout_results')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Erro ao acessar scout_results:', error.message);
  } else {
    console.log('Tabela scout_results acessível. Amostra:', data);
  }

  // Tentar outra tabela comum
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .limit(1);

  if (userError) {
    console.log('Erro ao acessar users:', userError.message);
  } else {
    console.log('Tabela users acessível. Amostra:', users);
  }
}

listTables();
