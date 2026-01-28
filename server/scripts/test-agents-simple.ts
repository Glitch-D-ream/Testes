/**
 * Teste simplificado dos agentes - um por vez
 */
import { logInfo, logError } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';

const TARGET = 'Jones Manoel';

async function testTargetDiscovery() {
  console.log('\n=== 1. TESTANDO TARGET DISCOVERY ===');
  try {
    const profile = await targetDiscoveryService.discover(TARGET);
    console.log('Perfil descoberto:');
    console.log(`  Nome: ${profile.name}`);
    console.log(`  Cargo: ${profile.office}`);
    console.log(`  Partido: ${profile.party}`);
    console.log(`  Estado: ${profile.state}`);
    console.log(`  Tipo: ${profile.profileType}`);
    return profile;
  } catch (error) {
    console.error('Erro no TargetDiscovery:', error);
    return null;
  }
}

async function testDirectSearch() {
  console.log('\n=== 2. TESTANDO DIRECT SEARCH ===');
  try {
    const results = await directSearchImproved.search(TARGET);
    console.log(`Total de resultados: ${results.length}`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`  [${i+1}] ${r.title.substring(0, 60)}...`);
      console.log(`      Fonte: ${r.source}`);
    });
    return results;
  } catch (error) {
    console.error('Erro no DirectSearch:', error);
    return [];
  }
}

async function main() {
  console.log('========================================');
  console.log('  TESTE SIMPLIFICADO DOS AGENTES');
  console.log('  Alvo: ' + TARGET);
  console.log('========================================');

  const startTime = Date.now();

  // 1. Target Discovery
  const profile = await testTargetDiscovery();

  // 2. Direct Search
  const sources = await testDirectSearch();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n========================================');
  console.log('  RESUMO DO TESTE');
  console.log('========================================');
  console.log(`Tempo total: ${elapsed}s`);
  console.log(`Perfil identificado: ${profile ? 'SIM' : 'NÃO'}`);
  console.log(`Fontes coletadas: ${sources.length}`);
  
  if (profile) {
    console.log(`\nPerfil: ${profile.name} (${profile.office}) - ${profile.party}/${profile.state}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
