
import { scoutHybrid } from './server/agents/scout-hybrid.ts';
import { normalizationService } from './server/services/normalization.service.ts';
import { logInfo } from './server/core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runErikaTest() {
  console.log('🚀 Iniciando Teste Direto: Erika Hilton (Seth VII)');
  
  try {
    // 1. Testar o Scout Hybrid (Busca e Ingestão)
    console.log('🔍 Passo 1: Buscando fontes para Erika Hilton...');
    const sources = await scoutHybrid.search('Erika Hilton', false);
    
    console.log(`✅ Encontradas ${sources.length} fontes.`);
    
    if (sources.length > 0) {
      const firstSource = sources[0];
      console.log('--- Primeira Fonte Encontrada ---');
      console.log(`Título: ${firstSource.title}`);
      console.log(`URL: ${firstSource.url}`);
      console.log(`Tipo: ${firstSource.type}`);
      console.log(`Tamanho do Conteúdo: ${firstSource.content.length} caracteres`);
      
      // 2. Testar a Normalização
      console.log('\n🧪 Passo 2: Testando Normalização do conteúdo extraído...');
      const normalized = normalizationService.process(firstSource.content);
      console.log('Dados Normalizados:', JSON.stringify({
        date: normalized.date,
        amount: normalized.amount,
        entities: normalized.entities.slice(0, 5)
      }, null, 2));
    }

    // 3. Testar busca de ausência (DOU + SP Transparência)
    console.log('\n🔎 Passo 3: Testando busca de ausência (DOU/SP)...');
    const absenceSources = await scoutHybrid.searchAbsence('Erika Hilton', 'Educação');
    console.log(`✅ Encontradas ${absenceSources.length} fontes de atos oficiais.`);
    
    if (absenceSources.length > 0) {
      console.log('Exemplo de ato oficial:', absenceSources[0].title);
    }

    console.log('\n✨ Teste de integridade concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

runErikaTest();
