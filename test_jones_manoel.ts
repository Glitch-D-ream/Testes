
import { scoutHybrid } from './server/agents/scout-hybrid.ts';
import { normalizationService } from './server/services/normalization.service.ts';
import { logInfo, logError } from './server/core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runJonesManoelTest() {
  console.log('🚀 Iniciando Teste de Auditoria: Jones Manoel (Seth VII)');
  
  try {
    // 1. Testar o Scout Hybrid (Busca e Ingestão)
    console.log('🔍 Passo 1: Buscando fontes para Jones Manoel...');
    const sources = await scoutHybrid.search('Jones Manoel', false);
    
    console.log(`✅ Encontradas ${sources.length} fontes.`);
    
    if (sources.length > 0) {
      console.log('\n📊 Amostra de Fontes Encontradas:');
      sources.slice(0, 3).forEach((s, i) => {
        console.log(`[${i+1}] ${s.title} (${s.source})`);
      });
      
      // 2. Testar a Normalização em um conteúdo real
      const contentWithPotentialData = sources.find(s => s.content.length > 500)?.content || sources[0].content;
      console.log('\n🧪 Passo 2: Testando Normalização do conteúdo...');
      const normalized = normalizationService.process(contentWithPotentialData);
      console.log('Dados Estruturados Identificados:', JSON.stringify({
        date: normalized.date,
        amount: normalized.amount,
        entitiesCount: normalized.entities.length,
        topEntities: normalized.entities.slice(0, 5)
      }, null, 2));
    }

    // 3. Testar busca de ausência e dados oficiais
    console.log('\n🔎 Passo 3: Buscando atos oficiais e transparência...');
    const officialSources = await scoutHybrid.searchAbsence('Jones Manoel', 'Cultura/Política');
    console.log(`✅ Encontradas ${officialSources.length} referências em portais oficiais.`);
    
    console.log('\n✨ Teste Jones Manoel concluído!');
  } catch (error) {
    logError('Erro no teste Jones Manoel', error as Error);
    process.exit(1);
  }
}

runJonesManoelTest();
