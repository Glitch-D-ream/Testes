
import { scoutRegional } from '../server/agents/scout-regional.ts';
import { filterAgent } from '../server/agents/filter.ts';

async function runTest() {
  const politicianName = "Maria da Silva";
  const context = {
    name: politicianName,
    office: "Vereadora",
    state: "SP",
    city: "São Paulo"
  };

  console.log(`\n🚀 TESTE COMPLETO SCOUT REGIONAL\n`);
  console.log(`Político: ${context.name}`);
  console.log(`Contexto: ${context.office}, ${context.city}, ${context.state}\n`);

  try {
    // FASE 1: Scout Regional
    console.log("--- FASE 1: SCOUT REGIONAL ---");
    const sources = await scoutRegional.search(context, false);
    console.log(`Fontes encontradas: ${sources.length}`);
    
    sources.slice(0, 5).forEach((s, i) => {
      console.log(`\n[${i+1}] ${s.title}`);
      console.log(`    Fonte: ${s.source}`);
      console.log(`    Tipo: ${s.type}`);
      console.log(`    Confiança: ${s.confidence}`);
      console.log(`    URL: ${s.url.substring(0, 70)}...`);
    });

    // FASE 2: Filter Flexível
    console.log("\n--- FASE 2: FILTER (FLEXÍVEL) ---");
    const filtered = await filterAgent.filter(sources, true);
    console.log(`Fontes aprovadas: ${filtered.length}`);
    
    filtered.slice(0, 3).forEach((s, i) => {
      console.log(`\n[${i+1}] ${s.title}`);
      console.log(`    Justificativa: ${s.justification}`);
    });

    console.log("\n✅ Teste concluído com sucesso!");

  } catch (error) {
    console.error("❌ Erro:", error);
  }
}

runTest();
