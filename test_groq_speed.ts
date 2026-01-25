
import { AIService } from './server/services/ai.service.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testGroq() {
  const aiService = new AIService();
  const testPrompt = "Gere um resumo técnico de 3 parágrafos sobre a importância da responsabilidade fiscal no Brasil, mantendo um tom de auditoria fria.";

  console.log("🚀 Iniciando teste de velocidade com Groq...");
  const startTime = Date.now();
  
  try {
    const result = await aiService.generateReport(testPrompt);
    const duration = Date.now() - startTime;
    
    console.log("\n✅ Teste Concluído!");
    console.log(`⏱️ Tempo Total: ${duration}ms`);
    console.log("\n📝 Resultado:");
    console.log(result);
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testGroq();
