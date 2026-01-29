import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários.');
  process.exit(1);
}

console.log('Tentando conectar ao Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key (prefixo):', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1);
    
    if (error) {
      console.log('Conexão estabelecida, mas erro ao acessar tabela (esperado se não existir):', error.message);
      if (error.message.includes('JWT')) {
        console.error('ERRO CRÍTICO: Problema com a chave JWT/Service Role.');
      }
    } else {
      console.log('Conexão bem-sucedida! Dados:', data);
    }

    // Testar autenticação simples
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Erro de autenticação:', authError.message);
    } else {
      console.log('Autenticação configurada corretamente.');
    }

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

testConnection();
