
import { scoutAgent } from '../agents/scout.ts';
import { getSupabase, initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Scout Worker Independente
 * Este script é projetado para rodar no GitHub Actions.
 * Ele busca notícias de políticos cadastrados e salva no Supabase.
 */
async function runScoutWorker() {
  logInfo('🚀 Iniciando Scout Worker Independente...');

  try {
    // 1. Inicializar conexão com o banco
    await initializeDatabase();
    const supabase = getSupabase();

    // 2. Buscar lista de políticos ativos para monitorar
    const { data: politicians, error: polError } = await supabase
      .from('politicians')
      .select('name')
      .limit(10); // Limite inicial para não estourar o tempo do worker

    if (polError) {
      logError('Erro ao buscar políticos:', polError as any);
    }

    if (!politicians || politicians.length === 0) {
      // Se não houver políticos, vamos usar uma lista padrão para teste
      const defaultPoliticians = ['Erika Hilton', 'Jones Manoel', 'Nikolas Ferreira', 'Lula', 'Bolsonaro'];
      logInfo(`Nenhum político encontrado no banco. Usando lista padrão: ${defaultPoliticians.join(', ')}`);
      
      for (const name of defaultPoliticians) {
        await processPolitician(name);
      }
    } else {
      logInfo(`Monitorando ${politicians.length} políticos encontrados no banco.`);
      for (const p of politicians) {
        await processPolitician(p.name);
      }
    }

    logInfo('✅ Scout Worker concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logError('Erro fatal no Scout Worker:', error as Error);
    process.exit(1);
  }
}

async function processPolitician(name: string) {
  logInfo(`🔍 Buscando dados para: ${name}`);
  try {
    // O ScoutAgent já salva no banco internamente via saveScoutHistory
    const results = await scoutAgent.search(name, true);
    logInfo(`✨ Encontradas ${results.length} fontes para ${name}`);
  } catch (error) {
    logError(`Erro ao processar ${name}:`, error as Error);
  }
}

// Executar o worker
runScoutWorker();
