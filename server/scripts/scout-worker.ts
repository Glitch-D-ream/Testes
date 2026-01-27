
import { getSupabase, initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import { QueueManager } from '../core/queue-manager.ts';
import { syncSiconfiData } from '../integrations/siconfi.ts';

/**
 * Scout Worker (Produtor de Filas)
 * Este script agora atua como um orquestrador que distribui tarefas para as filas.
 */
async function runScoutWorker() {
  logInfo('🚀 Iniciando Scout Worker (Orquestrador de Filas)...');

  try {
    // 1. Inicializar conexão com o banco
    await initializeDatabase();
    const supabase = getSupabase();

    // 2. Buscar lista de políticos ativos para monitorar
    const { data: politicians, error: polError } = await supabase
      .from('politicians')
      .select('name')
      .limit(50); // Aumentado o limite pois agora o processamento é distribuído

    const targetList = (politicians && politicians.length > 0) 
      ? politicians.map(p => p.name)
      : ['Erika Hilton', 'Jones Manoel', 'Nikolas Ferreira', 'Lula', 'Bolsonaro'];

    logInfo(`Distribuindo tarefas para ${targetList.length} políticos nas filas...`);

    for (const name of targetList) {
      // Usar o QueueManager para despachar com segurança (fallback incluso)
      await QueueManager.dispatchScrapingJob(name);
      logInfo(`📌 Job de scraping processado/agendado para: ${name}`);
    }

    // 3. Sincronizar dados orçamentários globais (SICONFI)
    logInfo('📊 Sincronizando dados orçamentários globais...');
    const categories = ['SAUDE', 'EDUCACAO', 'SEGURANCA_PUBLICA', 'URBANISMO', 'ASSISTENCIA_SOCIAL'];
    await syncSiconfiData(categories);

    logInfo('✅ Orquestração concluída. Os workers de fila processarão as tarefas em background.');
    
    // Pequeno delay para garantir que os jobs foram enviados antes de fechar o processo se necessário
    setTimeout(() => process.exit(0), 5000);
  } catch (error) {
    logError('Erro fatal no Scout Worker Orquestrador:', error as Error);
    process.exit(1);
  }
}

// Executar o worker
runScoutWorker();
