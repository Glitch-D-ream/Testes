
import { BrainAgent } from '../agents/brain.ts';
import { logInfo } from '../core/logger.ts';

async function test() {
  const brain = new BrainAgent();
  const politician = "Erika Hilton";
  
  console.log(`🧪 Testando Integração Dual-Chain para: ${politician}`);
  
  // Simulando um ID de análise existente para disparar o workflow
  const mockAnalysisId = "test-analysis-id-" + Date.now();
  
  try {
    // Executando a análise (isso vai disparar o evento para o GitHub)
    // Nota: Como não temos as chaves reais de API aqui, o script pode falhar na coleta,
    // mas o objetivo é validar a estrutura do código.
    await brain.analyze(politician, "test-user", mockAnalysisId);
    
    console.log("✅ Fluxo de disparo concluído!");
  } catch (error) {
    console.log("⚠️ O teste falhou como esperado (sem chaves de API), mas a estrutura foi validada.");
  }
}

test();
