import { scoutAgent } from '../server/agents/scout.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSearch(politician: string) {
  console.log(`\n--- Testando busca para: ${politician} ---`);
  try {
    const results = await scoutAgent.search(politician);
    console.log(`Resultados encontrados: ${results.length}`);
    results.forEach((r, i) => {
      console.log(`[${i+1}] ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Fonte: ${r.source}`);
    });
  } catch (error) {
    console.error(`Erro ao buscar ${politician}:`, error);
  }
}

async function runTests() {
  await testSearch('Nikolas Ferreira');
  await testSearch('Tarcísio de Freitas');
  await testSearch('Jones Manoel');
}

runTests();
