
import * as dotenv from 'dotenv';
dotenv.config();

import { aiResilienceNexus } from './server/services/ai-resilience-nexus.ts';
import { logInfo, logError } from './server/core/logger.ts';

async function testNexus() {
  logInfo('🧪 Testando Nexo de Resiliência: Auditoria Arthur Lira');
  
  const prompt = `
    AUDITORIA FORENSE: Arthur Lira
    Fatos: Presidente da Câmara, envolvido em discussões sobre o orçamento secreto.
    Tarefa: Identifique 2 riscos de transparência.
    Responda em tom profissional e adversarial.
  `;

  try {
    const response = await aiResilienceNexus.chat(prompt);
    console.log('\n--- RESPOSTA DO NEXO ---');
    console.log('Provedor:', response.provider);
    console.log('Modelo:', response.model);
    console.log('Conteúdo:', response.content);
    console.log('------------------------\n');
    process.exit(0);
  } catch (error) {
    logError('❌ Falha total no Nexo:', error as Error);
    process.exit(1);
  }
}

testNexus();
