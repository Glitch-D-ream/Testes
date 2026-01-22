
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

async function applyMigration() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Tentando aplicar migração via SQL Editor (Manual necessário se RPC falhar)');
  
  // Nota: O Supabase não permite executar SQL arbitrário via SDK por padrão por segurança.
  // O usuário deve colar o SQL no SQL Editor do painel do Supabase.
  
  const sql = fs.readFileSync('./scripts/generate-sql.ts', 'utf8').split('const sql = `')[1].split('`;')[0];
  
  console.log('\n--- COPIE O SQL ABAIXO E COLE NO SQL EDITOR DO SUPABASE ---\n');
  console.log(sql);
  console.log('\n--- FIM DO SQL ---\n');
}

applyMigration();
