
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Teste de integração com DuckDuckGo AI Chat (Sem Chave)
 * Baseado no protocolo de chat anônimo do DDG
 */
async function testDDGAI() {
  logInfo('🧪 Testando DuckDuckGo AI Bridge (Zero Key)...');
  
  try {
    // 1. Obter VQD (Token de Verificação)
    const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
      headers: { 'x-vqd-accept': '1' }
    });
    const vqd = statusRes.headers['x-vqd-token'];
    
    if (!vqd) throw new Error('Falha ao obter VQD do DuckDuckGo');
    logInfo('✅ VQD obtido com sucesso.');

    // 2. Enviar Mensagem de Teste
    const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Resuma em uma frase quem é Nikolas Ferreira.' }]
    }, {
      headers: {
        'x-vqd-token': vqd,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      responseType: 'text'
    });

    if (chatRes.data) {
      logInfo('✅ Resposta recebida do DDG AI.');
      console.log('\n--- RESPOSTA DDG AI ---');
      // O DDG retorna um stream, vamos apenas verificar se há conteúdo
      console.log(chatRes.data.substring(0, 200) + '...');
      console.log('-----------------------\n');
    }

  } catch (error: any) {
    logError(`❌ Falha no teste DDG AI: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDDGAI();
