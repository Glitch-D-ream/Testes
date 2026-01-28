import { SmartScout } from '../agents/smartScout.ts';
import { initializeDatabase, getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testJonesManoel() {
  logInfo('=== TESTE: Busca por Jones Manoel ===');
  
  try {
    // Inicializar banco de dados
    logInfo('[1/4] Inicializando conexão com Supabase...');
    await initializeDatabase();
    const supabase = getSupabase();
    logInfo('[1/4] Supabase conectado com sucesso!');
    
    // Criar instância do SmartScout
    logInfo('[2/4] Criando instância do SmartScout...');
    const scout = new SmartScout({
      maxResultsPerSource: 10,
      timeoutMs: 30000,
      useCache: true,
      cacheTtlHours: 1,
      prioritizeOfficialSources: true
    });
    
    // Executar busca
    logInfo('[3/4] Executando busca por "Jones Manoel"...');
    const startTime = Date.now();
    const results = await scout.searchPolitician('Jones Manoel');
    const elapsed = Date.now() - startTime;
    
    logInfo(`[4/4] Busca concluída em ${elapsed}ms`);
    logInfo(`Total de resultados: ${results.length}`);
    
    // Exibir resultados
    if (results.length > 0) {
      logInfo('\n--- RESULTADOS ---');
      results.slice(0, 5).forEach((r: any, i: number) => {
        logInfo(`\n[${i + 1}] ${r.title}`);
        logInfo(`    Fonte: ${r.source}`);
        logInfo(`    URL: ${r.url}`);
        logInfo(`    Conteúdo: ${r.content?.substring(0, 150)}...`);
      });
    } else {
      logInfo('Nenhum resultado encontrado.');
    }
    
    // Estatísticas do cache
    const cacheStats = scout.getCacheStats();
    logInfo('\n--- ESTATÍSTICAS DO CACHE ---');
    logInfo(JSON.stringify(cacheStats, null, 2));
    
    logInfo('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
    
  } catch (error) {
    logError('Erro no teste:', error as Error);
    process.exit(1);
  }
  
  process.exit(0);
}

testJonesManoel();
