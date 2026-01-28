
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

async function testPollinations() {
  logInfo('🧪 Testando Pollinations AI Multi-Model (Zero Key)...');
  
  const models = ['deepseek-r1', 'llama-3.3-70b', 'mistral-large', 'qwen-qwq'];
  
  for (const model of models) {
    try {
      logInfo(`Tentando modelo: ${model}`);
      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [{ role: 'user', content: 'Resuma em uma frase quem é Nikolas Ferreira.' }],
        model: model,
        seed: Math.floor(Math.random() * 1000)
      }, { timeout: 30000 });
      
      if (response.data) {
        logInfo(`✅ Sucesso com ${model}`);
        console.log(`Resposta: ${response.data.substring(0, 150)}...`);
      }
    } catch (error: any) {
      logError(`❌ Falha no modelo ${model}: ${error.message}`);
    }
  }
}

testPollinations();
