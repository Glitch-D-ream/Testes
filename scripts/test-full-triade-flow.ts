import { scoutAgent } from '../server/agents/scout.js';
import { filterAgent } from '../server/agents/filter.js';
import { brainAgent } from '../server/agents/brain.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testFullFlow() {
  const name = process.argv[2] || 'Nikolas Ferreira';
  console.log(`--- Testando Fluxo Completo da Tríade para: ${name} ---`);
  
  try {
    // 1. Scout
    console.log('\n[1/3] Executando ScoutAgent...');
    const rawSources = await scoutAgent.search(name);
    console.log(`   Fontes encontradas: ${rawSources.length}`);
    
    if (rawSources.length === 0) throw new Error('Scout falhou em encontrar fontes.');

    // 2. Filter
    console.log('\n[2/3] Executando FilterAgent...');
    const filteredSources = await filterAgent.filter(rawSources);
    console.log(`   Fontes filtradas: ${filteredSources.length}`);
    
    if (filteredSources.length === 0) throw new Error('Filter barrou todas as fontes.');

    // 3. Brain
    console.log('\n[3/3] Executando BrainAgent...');
    const analysis = await brainAgent.analyze(name, filteredSources);
    
    console.log('\n✅ FLUXO CONCLUÍDO COM SUCESSO!');
    console.log(`   Score de Probabilidade: ${Math.round(analysis.probabilityScore * 100)}%`);
    console.log(`   Promessas Extraídas: ${analysis.promises.length}`);
    
  } catch (error) {
    console.error('\n❌ ERRO NO FLUXO:', error);
  }
}

testFullFlow();
