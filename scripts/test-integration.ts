import { multiScoutAgent } from '../server/agents/multi-scout.ts';
import { brainAgent } from '../server/agents/brain.ts';
import { logInfo, logError } from '../server/core/logger.ts';
import dotenv from 'dotenv';

dotenv.config();

async function runIntegrationTest() {
  const testPolitician = "Político de Teste";
  const testQuery = "promessas de saúde e educação";

  logInfo(`🚀 Iniciando Teste de Integração para: ${testPolitician}`);

  try {
    // 1. Testar Scout (DuckDuckGo / RSS)
    logInfo("Step 1: Testando Scout Agent...");
    const sources = await multiScoutAgent.search(testQuery);
    logInfo(`✅ Scout encontrou ${sources.length} fontes.`);
    
    if (sources.length === 0) {
      logError("❌ Falha: Nenhuma fonte encontrada pelo Scout.");
      return;
    }

    // 2. Testar Brain (Análise e Categorização)
    logInfo("Step 2: Testando Brain Agent (Análise)...");
    // Simulando userId nulo para teste
    const analysis = await brainAgent.analyze(testPolitician, sources.map(s => ({
      ...s,
      justification: "Fonte relevante para teste de integração"
    })));
    
    logInfo("✅ Brain concluiu a análise.");
    logInfo(`📊 Categoria Detectada: ${analysis.mainCategory}`);
    logInfo(`💰 Viabilidade Orçamentária: ${analysis.budgetViability.viable ? 'Viável' : 'Inviável'}`);

    // 3. Verificar se os dados estão estruturados corretamente para o Dashboard
    logInfo("Step 3: Validando estrutura de dados para o Dashboard...");
    if (analysis.id && analysis.budgetViability && analysis.mainCategory) {
      logInfo("✅ Estrutura de dados validada com sucesso.");
    } else {
      logError("❌ Falha: Dados da análise incompletos.");
    }

    logInfo("🎉 Teste de Integração Concluído com Sucesso!");
  } catch (error) {
    logError("❌ Erro durante o teste de integração:", error as Error);
  }
}

runIntegrationTest();
