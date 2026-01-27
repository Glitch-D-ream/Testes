
import { BrainAgent } from './server/agents/brain.ts';
import { logInfo, logError } from './server/core/logger.ts';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testJonesManoel() {
  console.log('🚀 Iniciando Teste Interno da Tríade: Jones Manoel');
  
  const brain = new BrainAgent();
  
  try {
    console.log('--- FASE 1: SCOUT & FILTER & BRAIN ---');
    // O método analyze já executa o Scout e o Filter internamente
    const result = await brain.analyze('Jones Manoel');
    
    console.log('✅ Teste concluído com sucesso!');
    console.log('--- RESULTADOS ---');
    console.log(`Político: ${result.politicianName}`);
    console.log(`Partido: ${result.politician.party}`);
    console.log(`Estado: ${result.politician.state}`);
    console.log(`Fontes encontradas: ${result.sourcesCount}`);
    
    // Verificar se gerou promessas (isso indicaria que a IA funcionou)
    // Nota: Como não temos a chave da IA configurada no ambiente local do Manus, 
    // esperamos ver como o sistema lida com o fallback.
  } catch (error) {
    console.error('❌ Erro durante o teste da tríade:', error);
  }
}

testJonesManoel();
