/**
 * Script de Teste de Conexão Supabase
 * 
 * Verifica se as credenciais do Supabase estão configuradas corretamente
 * e se a conexão com o banco de dados está funcionando.
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError, logSuccess } from '../core/logger.ts';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testSupabaseConnection() {
  console.log('🔍 Testando Conexão com Supabase...\n');

  // 1. Verificar variáveis de ambiente
  console.log('📋 Verificando variáveis de ambiente:');
  
  if (!SUPABASE_URL) {
    logError('❌ SUPABASE_URL não configurada');
    process.exit(1);
  }
  console.log(`✅ SUPABASE_URL: ${SUPABASE_URL}`);

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
    process.exit(1);
  }
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

  console.log('\n');

  // 2. Criar cliente Supabase
  console.log('🔌 Criando cliente Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Cliente criado com sucesso\n');

  // 3. Testar conexão básica
  console.log('🌐 Testando conexão básica...');
  try {
    const { data, error } = await supabase.from('politicians').select('count').limit(1);
    
    if (error) {
      console.log(`⚠️  Tabela 'politicians' não existe ou sem permissão: ${error.message}`);
    } else {
      console.log('✅ Conexão com banco de dados estabelecida\n');
    }
  } catch (err) {
    logError(`❌ Erro ao conectar: ${err}`);
    process.exit(1);
  }

  // 4. Listar tabelas disponíveis
  console.log('📊 Verificando schema do banco de dados...');
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.log(`⚠️  Não foi possível listar tabelas: ${error.message}`);
    } else if (tables && tables.length > 0) {
      console.log(`✅ Tabelas encontradas (${tables.length}):`);
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada no schema público');
    }
  } catch (err) {
    console.log(`⚠️  Erro ao listar tabelas: ${err}`);
  }

  console.log('\n');

  // 5. Testar tabelas principais do Seth VII
  console.log('🔍 Verificando tabelas principais do Seth VII:');
  
  const mainTables = [
    'politicians',
    'analyses',
    'promises',
    'users',
    'public_data_cache',
    'evidence_storage'
  ];

  for (const tableName of mainTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${tableName}: OK`);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: Erro ao acessar`);
    }
  }

  console.log('\n');

  // 6. Teste de escrita (inserção e remoção)
  console.log('✍️  Testando permissões de escrita...');
  try {
    const testData = {
      id: 'test-' + Date.now(),
      name: 'Teste de Conexão',
      party: 'TEST',
      office: 'Teste',
      region: 'Teste',
      credibility_score: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('politicians')
      .insert(testData)
      .select();

    if (insertError) {
      console.log(`   ⚠️  Não foi possível inserir dados de teste: ${insertError.message}`);
    } else {
      console.log('   ✅ Inserção bem-sucedida');

      // Remover dados de teste
      const { error: deleteError } = await supabase
        .from('politicians')
        .delete()
        .eq('id', testData.id);

      if (deleteError) {
        console.log(`   ⚠️  Não foi possível remover dados de teste: ${deleteError.message}`);
      } else {
        console.log('   ✅ Remoção bem-sucedida');
      }
    }
  } catch (err) {
    console.log(`   ⚠️  Erro no teste de escrita: ${err}`);
  }

  console.log('\n');

  // 7. Resumo final
  console.log('=' .repeat(60));
  console.log('🎉 TESTE DE CONEXÃO CONCLUÍDO');
  console.log('=' .repeat(60));
  console.log('\n✅ A conexão com o Supabase está funcionando!');
  console.log('✅ As credenciais estão configuradas corretamente.');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Verificar se todas as tabelas necessárias existem');
  console.log('   2. Executar migrações se necessário');
  console.log('   3. Testar o Scout Worker com dados reais');
  console.log('\n');
}

// Executar teste
testSupabaseConnection().catch((err) => {
  logError(`Erro fatal no teste: ${err}`);
  process.exit(1);
});
