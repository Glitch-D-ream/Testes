
import * as dotenv from 'dotenv';
import { aiService } from './server/services/ai.service.js';

dotenv.config();

async function testAI() {
  console.log('🚀 Iniciando teste das chaves de IA...');
  const testText = "Vou construir 100 novas escolas em São Paulo até 2026.";

  try {
    console.log('\n--- Testando Fluxo de Análise (com Fallback) ---');
    const result = await aiService.analyzeText(testText);
    console.log('✅ Sucesso na análise!');
    console.log('Promessas extraídas:', result.promises.length);
    console.log('Sentimento:', result.overallSentiment);
    console.log('Score de Credibilidade:', result.credibilityScore);
  } catch (error) {
    console.error('❌ Erro crítico no serviço de IA:', error);
  }
}

testAI();
