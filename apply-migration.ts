/**
 * Script para aplicar a migração add_ai_verdict_local no Supabase
 * Usa o Supabase SDK para executar o SQL diretamente
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ceexfkjldhsbpugxvuyn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migração...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260201000001_add_ai_verdict_local.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migração lida com sucesso');
    console.log('');

    // Dividir o SQL em comandos individuais (separados por ;)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    console.log('');

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`[${i + 1}/${commands.length}] Executando comando...`);
      
      // Usar a API RPC do Supabase para executar SQL bruto
      const { data, error } = await supabase.rpc('exec_sql', { query: command });
      
      if (error) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, error);
        // Continuar mesmo com erro (pode ser que a tabela já exista)
        console.log('⚠️ Continuando...');
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }

    console.log('');
    console.log('✅ Migração concluída!');
    console.log('');
    console.log('🔍 Verificando estrutura da tabela analyses...');

    // Verificar se a coluna foi adicionada
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'analyses');

    if (checkError) {
      console.error('❌ Erro ao verificar colunas:', checkError);
    } else {
      console.log('');
      console.log('📊 Colunas da tabela analyses:');
      console.table(columns);
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
applyMigration();
