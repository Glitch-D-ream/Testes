
import * as dotenv from 'dotenv';
import { aiService } from './server/services/ai.service.js';
import { logInfo, logError } from './server/core/logger.js';

dotenv.config();

async function testAllProviders() {
  console.log('🧪 Iniciando Teste de Estresse dos Provedores de IA...\n');
  const testText = "Vou construir 50 novas creches e reduzir o IPTU em 20% no próximo ano.";

  const providers = [
    { name: 'Gemini', key: process.env.GEMINI_API_KEY },
    { name: 'DeepSeek', key: process.env.DEEPSEEK_API_KEY },
    { name: 'Groq', key: process.env.GROQ_API_KEY },
    { name: 'Open Source (Pollinations)', key: 'FREE' }
  ];

  for (const provider of providers) {
    console.log(`\n--- Testando Provedor: ${provider.name} ---`);
    if (!provider.key || provider.key.length < 10 && provider.name !== 'Open Source (Pollinations)') {
      console.log(`⚠️  Chave para ${provider.name} não configurada ou inválida.`);
      continue;
    }

    try {
      // Forçaremos o teste de cada um individualmente se possível, 
      // mas como o aiService.analyzeText tem lógica de fallback, 
      // vamos testar o fluxo geral e ver qual responde nos logs.
      const result = await aiService.analyzeText(testText);
      console.log(`✅ Sucesso no fluxo de análise!`);
      console.log(`📊 Resultado: ${result.promises.length} promessas encontradas.`);
      console.log(`🧠 Sentimento: ${result.overallSentiment}`);
    } catch (error) {
      console.log(`❌ Falha crítica no fluxo para ${provider.name}`);
    }
  }
}

testAllProviders();
