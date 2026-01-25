#!/usr/bin/env node
/**
 * Script para migrar do Scout antigo para o SmartScout
 * Executar: npx tsx scripts/migrateToSmartScout.ts
 */

import { ScoutAgent } from '../server/agents/scoutAgent.ts';

async function migrate() {
  console.log('🔄 Iniciando migração para SmartScout...');
  
  // 1. Inicializa novo Scout
  const scout = new ScoutAgent();
  
  // 2. Busca políticos populares para testar
  const testPoliticians = ['Lula', 'Bolsonaro', 'Tebet', 'Moraes', 'Pacheco'];
  
  for (const politician of testPoliticians) {
    console.log(`\n🔍 Testando busca para: ${politician}`);
    
    try {
      const startTime = Date.now();
      const results = await scout.execute(politician);
      const elapsed = Date.now() - startTime;
      
      console.log(`✅ ${politician}: ${results.totalResults} resultados em ${elapsed}ms`);
      console.log(`   Fontes: ${results.metadata.sourcesUsed.join(', ')}`);
      
      if (results.totalResults === 0) {
        console.warn(`⚠️  Nenhum resultado para ${politician}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Erro em ${politician}:`, error.message);
    }
  }
  
  // 3. Mostra diagnóstico
  console.log('\n📊 Diagnóstico final:');
  const diagnostics = await scout.getDiagnostics();
  console.log('Cache stats:', diagnostics.cacheStats);
  console.log('Fontes mais bem sucedidas:', diagnostics.sourceStats.slice(0, 5));
  
  console.log('\n✅ Migração concluída!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Atualize o arquivo server/agents/scout.ts para usar ScoutAgent');
  console.log('2. Execute testes completos: npm test');
  console.log('3. Monitore por 24h antes de desativar o scout antigo');
}

migrate().catch(console.error);
