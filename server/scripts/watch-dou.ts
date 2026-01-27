
import { douService } from '../services/dou.service.ts';
import { logInfo, logError } from '../core/logger.ts';
import { getSupabase } from '../core/database.ts';
import { RelationshipMiner } from '../modules/relationship-miner.ts';

/**
 * Watch DOU Script
 * Monitora atos oficiais e dispara o processamento de inteligência (Grafos e Relacionamentos)
 */
async function watchDOU() {
  logInfo('🕵️‍♂️ Iniciando monitoramento automático do Diário Oficial da União (DOU)...');

  try {
    const supabase = getSupabase();
    
    // 1. Buscar políticos ativos para monitoramento
    const { data: politicians, error: pError } = await supabase
      .from('politicians')
      .select('id, name')
      .limit(10);

    if (pError) throw pError;

    const targets = politicians || [{ id: 'manual-watch', name: 'Lula' }];

    for (const politician of targets) {
      logInfo(`🔍 Verificando atos recentes para: ${politician.name}`);
      
      const acts = await douService.searchActs(politician.name);
      
      for (const act of acts) {
        // 2. Verificar se já processamos este ato (evitar duplicidade)
        const { data: existing } = await supabase
          .from('entity_connections')
          .select('id')
          .eq('source_document', act.url)
          .limit(1);

        if (existing && existing.length > 0) {
          logInfo(`⏩ Ato já processado anteriormente: ${act.title}`);
          continue;
        }

        logInfo(`✨ Novo ato detectado! Processando inteligência: ${act.title}`);

        // 3. Minerar relacionamentos (Grafos)
        await RelationshipMiner.mineAndStore(
          act.content,
          act.url,
          politician.id
        );

        logInfo(`✅ Inteligência extraída com sucesso para o ato: ${act.title}`);
      }
    }

    logInfo('🏁 Monitoramento do DOU concluído com sucesso.');
  } catch (error) {
    logError('❌ Falha no monitoramento do DOU:', error as Error);
    process.exit(1);
  }
}

// Executar
watchDOU();
