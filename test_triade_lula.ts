
import { brainAgent } from './server/agents/brain.ts';
import { logInfo, logError } from './server/core/logger.ts';
import { getSupabase } from './server/core/database.ts';
import { nanoid } from 'nanoid';

async function testLula() {
  const politicianName = "Lula";
  const analysisId = `test-lula-${nanoid(5)}`;
  
  console.log(`\n🚀 INICIANDO TESTE DE ALTA COMPLEXIDADE: ${politicianName}`);
  console.log(`🆔 ID da Análise: ${analysisId}\n`);

  try {
    // Simular o fluxo do SearchService.autoAnalyzePolitician
    const supabase = getSupabase();
    
    console.log("1. Criando registro inicial no Supabase...");
    await supabase.from('analyses').insert([{
      id: analysisId,
      author: politicianName,
      politician_name: politicianName,
      text: `Teste interno iniciado para ${politicianName}`,
      status: 'processing'
    }]);

    console.log("2. Chamando BrainAgent.analyze (Tríade Completa)...");
    const startTime = Date.now();
    
    // O BrainAgent.analyze já chama Scout e Filter internamente
    const result = await brainAgent.analyze(politicianName, null, analysisId);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ TESTE CONCLUÍDO EM ${duration}s`);
    
    // Verificar resultado final no banco
    const { data: finalData } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    console.log("\n--- RESULTADOS DA AUDITORIA ---");
    console.log(`Status: ${finalData.status}`);
    console.log(`Político: ${finalData.politician_name}`);
    console.log(`Partido/Estado: ${finalData.party}/${finalData.state}`);
    console.log(`Score de Consistência: ${finalData.probability_score}%`);
    console.log(`Promessas Extraídas: ${finalData.extracted_promises ? 'Sim' : 'Não'}`);
    console.log(`Tamanho do Parecer: ${finalData.text?.length} caracteres`);
    
    if (finalData.status === 'completed') {
      console.log("\n🚀 SUCESSO: O sistema processou um político de alto perfil corretamente.");
    } else {
      console.log("\n⚠️ AVISO: O status final não é 'completed'. Verifique os logs.");
    }

  } catch (error) {
    console.error("\n❌ FALHA NO TESTE:");
    console.error(error);
    process.exit(1);
  }
}

testLula();
