
import { brainAgent } from '../server/agents/brain.ts';
import { logInfo, logError } from '../server/core/logger.ts';

async function runTest() {
  const targets = [
    "Luiz Inácio Lula da Silva",
    "Tarcísio de Freitas",
    "Nikolas Ferreira",
    "João Campos" // Prefeito (Municipal)
  ];

  console.log("=== INICIANDO TESTE DE ESTRESSE: IDENTIDADE DINÂMICA v2.6 ===");

  for (const target of targets) {
    try {
      console.log(`\n[TESTE] Analisando Alvo: ${target}...`);
      const result = await brainAgent.analyze(target);
      
      console.log(`[RESULTADO] Alvo: ${result.politicianName}`);
      console.log(`[CARGO] ${result.politician.office}`);
      console.log(`[PARTIDO] ${result.politician.party}`);
      console.log(`[FONTES] ${result.consensusMetrics?.sourceCount || 0} coletadas`);
      console.log(`[STATUS] ${result.viabilityScore > 0 ? 'DADOS PRESENTES' : 'ALERTA: SEM DADOS'}`);
      
      if (result.politician.office === 'Deputado Federal' && result.politician.party === 'PP' && target.includes('Lula')) {
        console.error("!!! FALHA CRÍTICA: Erro de identificação persistente para Lula !!!");
      }
    } catch (error) {
      console.error(`[ERRO] Falha ao testar ${target}:`, error);
    }
  }
  
  console.log("\n=== TESTE CONCLUÍDO ===");
}

runTest();
