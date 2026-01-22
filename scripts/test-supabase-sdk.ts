
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testSDK() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log('Testando conexão via SDK com:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Tenta buscar da tabela 'users' que acabamos de criar
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Erro no SDK:', error);
    } else {
      console.log('✅ Conexão via SDK funcionou perfeitamente! Tabelas detectadas.');
      console.log('Dados (vazio esperado):', data);
    }
  } catch (err) {
    console.error('❌ Erro catastrófico no SDK:', err);
  }
}

testSDK();
