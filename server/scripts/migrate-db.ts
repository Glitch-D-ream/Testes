
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function migrate() {
  const supabase = getSupabase();
  logInfo('[Migrate] Iniciando migração de schema no Supabase...');

  // Como o Supabase JS não permite rodar DDL (ALTER TABLE) diretamente via query builder por segurança,
  // tentamos usar a extensão 'http' se disponível ou o RPC 'exec_sql' se o usuário criou.
  // Caso contrário, informamos as queries para o usuário rodar no SQL Editor.
  
  const sqlQueries = [
    `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS politician_name TEXT;`,
    `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS office TEXT;`,
    `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS party TEXT;`,
    `ALTER TABLE analyses ADD COLUMN IF NOT EXISTS state TEXT;`,
    `COMMENT ON COLUMN analyses.politician_name IS 'Nome canônico do político analisado';`
  ];

  logInfo('[Migrate] Tentando executar migração via RPC...');
  
  // Tentar rodar via uma função RPC genérica se existir (comum em setups de agentes)
  const { error } = await supabase.rpc('exec_sql', { sql_query: sqlQueries.join('\n') });

  if (error) {
    logError('[Migrate] Falha ao executar via RPC (provavelmente função exec_sql não existe).', error);
    logInfo('\n⚠️ AÇÃO REQUERIDA: Copie e cole os comandos abaixo no SQL Editor do seu Supabase (https://supabase.com/dashboard/project/ceexfkjldhsbpugxvuyn/sql/new):\n');
    console.log(sqlQueries.join('\n'));
    
    // Fallback: Tentar inserir um registro de teste para ver se o banco aceita colunas dinâmicas (improvável em Postgres)
    logInfo('\n[Migrate] Tentando alternativa via API REST...');
  } else {
    logInfo('[Migrate] Migração concluída com sucesso via RPC!');
  }
}

migrate();
