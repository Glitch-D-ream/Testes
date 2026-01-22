
import dotenv from 'dotenv';
import { AIService } from './server/services/ai.service.js';
import { logInfo, logError } from './server/core/logger.js';

dotenv.config();

async function testAIProviders() {
  const aiService = new AIService();
  const sampleText = "Eu prometo que vou construir 50 novas escolas em São Paulo até o final de 2026 e reduzir o desemprego em 10%.";

  console.log('--- Iniciando Teste de Provedores de IA ---');
  console.log(`Texto de teste: "${sampleText}"\n`);

  // Testar Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('Testando Gemini...');
      const result = await (aiService as any).analyzeWithGemini(sampleText);
      console.log('✅ Gemini: OK');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Gemini: FALHOU');
      console.error(error);
    }
  } else {
    console.log('⚠️ Gemini: Chave não configurada');
  }

  console.log('\n-------------------\n');

  // Testar Groq
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('Testando Groq...');
      const result = await (aiService as any).analyzeWithGroq(sampleText);
      console.log('✅ Groq: OK');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Groq: FALHOU');
      console.error(error);
    }
  } else {
    console.log('⚠️ Groq: Chave não configurada');
  }

  console.log('\n-------------------\n');

  // Testar Provedores via Manus (OpenAI SDK)
  if (process.env.OPENAI_API_KEY) {
    const openai = new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY });
    
    // Testar gpt-4.1-mini
    try {
      console.log('Testando gpt-4.1-mini...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: (aiService as any).promptTemplate(sampleText) }],
        response_format: { type: 'json_object' },
      });
      console.log('✅ gpt-4.1-mini: OK');
      console.log(response.choices[0]?.message?.content);
    } catch (error) {
      console.error('❌ gpt-4.1-mini: FALHOU');
      console.error(error);
    }

    console.log('\n-------------------\n');

    // Testar gemini-2.5-flash
    try {
      console.log('Testando gemini-2.5-flash...');
      const response = await openai.chat.completions.create({
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: (aiService as any).promptTemplate(sampleText) }],
        response_format: { type: 'json_object' },
      });
      console.log('✅ gemini-2.5-flash: OK');
      console.log(response.choices[0]?.message?.content);
    } catch (error) {
      console.error('❌ gemini-2.5-flash: FALHOU');
      console.error(error);
    }
  } else {
    console.log('⚠️ OpenAI_API_KEY: Chave não configurada');
  }

  console.log('\n--- Teste Finalizado ---');
}

testAIProviders().catch(console.error);
