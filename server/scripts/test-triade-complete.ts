
import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { filterAgent } from '../agents/filter.ts';
import { BrainAgent } from '../agents/brain.ts';
import { logInfo, logError } from '../core/logger.ts';

async function testTriadeComplete() {
  const politicianName = 'Arthur Lira';
  const brain = new BrainAgent();
  
  console.log(`\n🕵️‍♂️ TESTE E2E - TRÍADE DE AGENTES SETH VII`);
  console.log(`========================================`);
  console.log(`Alvo: ${politicianName}\n`);

  try {
    // FASE 1: SCOUT (Busca Enriquecida)
    logInfo(`[Fase 1] Scout: Coletando dados (Notícias, Oficiais, Entrevistas)...`);
    const rawSources = await scoutHybrid.search(politicianName, true);
    console.log(`✅ Scout: ${rawSources.length} fontes brutas coletadas.`);

    // FASE 2: FILTER (Filtragem Inteligente)
    logInfo(`[Fase 2] Filter: Validando relevância e credibilidade...`);
    const filteredSources = await filterAgent.filter(rawSources);
    console.log(`✅ Filter: ${filteredSources.length} fontes selecionadas.`);

    // FASE 3: BRAIN (Análise e Auditoria)
    logInfo(`[Fase 3] Brain: Cruzando dados e gerando parecer técnico...`);
    // O método analyze agora recebe (politicianName, userId, existingId)
    const dataSources = await brain.analyze(politicianName, null, null);
    
    console.log(`\n📊 RESULTADO DA ANÁLISE DO BRAIN:`);
    console.log(`---------------------------------`);
    console.log(`Político: ${dataSources.politician.office} ${politicianName}`);
    console.log(`Partido: ${dataSources.politician.party}`);
    console.log(`Foco Principal: ${dataSources.mainCategory}`);
    console.log(`Veredito Orçamentário: ${dataSources.budgetVerdict}`);
    
    console.log(`\n🔍 Resumo do Orçamento:`);
    console.log(dataSources.budgetSummary);

    console.log(`\n⚖️ Análise de Contraste (Diz vs Faz):`);
    console.log(`- Alinhamento Partidário: ${dataSources.partyAlignment}%`);
    console.log(`- Coerência Tópica: ${JSON.stringify(dataSources.topicalCoherence)}`);

    console.log(`\n🎉 Teste E2E concluído com sucesso! A tríade está operando em harmonia com os novos dados.`);
  } catch (error) {
    logError(`❌ Falha no teste E2E da Tríade`, error as Error);
    process.exit(1);
  }
}

testTriadeComplete().catch(console.error);
