/**
 * Teste de busca para Jones Manoel
 * Usa o ScoutAgent que integra com a tabela canonical_politicians
 */
import { ScoutAgent } from '../agents/scoutAgent.ts';
import { initializeDatabase, getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testJonesManoel() {
  logInfo('=== TESTE V2: Busca por Jones Manoel ===');
  
  try {
    // Inicializar banco de dados
    logInfo('[1/5] Inicializando conexão com Supabase...');
    await initializeDatabase();
    const supabase = getSupabase();
    logInfo('[1/5] Supabase conectado!');
    
    // Verificar se Jones Manoel está na tabela canonical_politicians
    logInfo('[2/5] Verificando tabela canonical_politicians...');
    const { data: canonical, error: canonicalError } = await supabase
      .from('canonical_politicians')
      .select('*')
      .ilike('search_name', '%jones%');
    
    if (canonicalError) {
      logError('[2/5] Erro ao buscar canonical_politicians:', canonicalError as any);
    } else if (canonical && canonical.length > 0) {
      logInfo(`[2/5] Encontrado na tabela canônica: ${JSON.stringify(canonical[0])}`);
    } else {
      logWarn('[2/5] Jones Manoel NÃO está na tabela canonical_politicians');
      logInfo('[2/5] Inserindo Jones Manoel na tabela canônica para teste...');
      
      const { error: insertError } = await supabase
        .from('canonical_politicians')
        .insert({
          id: 'jones-manoel-test',
          search_name: 'jones manoel',
          full_name: 'Jones Manoel de Freitas',
          official_role: 'Influenciador Político',
          party: 'PCB',
          state: 'PE',
          is_active: true
        });
      
      if (insertError) {
        logError('[2/5] Erro ao inserir:', insertError as any);
      } else {
        logInfo('[2/5] Jones Manoel inserido com sucesso!');
      }
    }
    
    // Verificar scout_history existente
    logInfo('[3/5] Verificando histórico de buscas anteriores...');
    const { data: history, error: historyError } = await supabase
      .from('scout_history')
      .select('id, title, source, url, created_at')
      .ilike('politician_name', '%jones%')
      .limit(5);
    
    if (historyError) {
      logError('[3/5] Erro ao buscar scout_history:', historyError as any);
    } else if (history && history.length > 0) {
      logInfo(`[3/5] Encontrados ${history.length} registros anteriores:`);
      history.forEach((h: any, i: number) => {
        logInfo(`  [${i+1}] ${h.title} (${h.source})`);
      });
    } else {
      logWarn('[3/5] Nenhum histórico encontrado para Jones Manoel');
    }
    
    // Testar o ScoutAgent
    logInfo('[4/5] Executando ScoutAgent.execute("Jones Manoel")...');
    const agent = new ScoutAgent();
    const startTime = Date.now();
    const results = await agent.execute('Jones Manoel');
    const elapsed = Date.now() - startTime;
    
    logInfo(`[5/5] Busca concluída em ${elapsed}ms`);
    logInfo(`Resultado: ${JSON.stringify(results, null, 2)}`);
    
    // Diagnósticos
    const diagnostics = await agent.getDiagnostics();
    logInfo('\n--- DIAGNÓSTICOS ---');
    logInfo(JSON.stringify(diagnostics, null, 2));
    
    logInfo('\n=== TESTE V2 CONCLUÍDO ===');
    
  } catch (error) {
    logError('Erro no teste:', error as Error);
    process.exit(1);
  }
  
  process.exit(0);
}

testJonesManoel();
