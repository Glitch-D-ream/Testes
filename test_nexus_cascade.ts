import { aiResilienceNexus } from './server/services/ai-resilience-nexus.ts';
import { logInfo, logError } from './server/core/logger.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE NEXO DE RESILIÊNCIA (CASCATA) ---');
  
  const testPrompt = "Olá, você é um assistente de teste. Responda apenas com a palavra 'OK' e o nome do seu modelo.";
  
  try {
    console.log('Iniciando chat com cascata de modelos...');
    const startTime = Date.now();
    
    const response = await aiResilienceNexus.chat(testPrompt);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Resposta recebida em ${duration}s`);
    console.log('--- RESULTADO ---');
    console.log('Provedor:', response.provider);
    console.log('Modelo:', response.model);
    console.log('Conteúdo:', response.content);
    
  } catch (error) {
    console.error('Erro fatal na cascata de IA:', error);
  }
}

test();
