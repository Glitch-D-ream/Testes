
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Teste de integração com Google Gemini API (Free Tier)
 * Requer chave, mas o Free Tier é generoso (15 RPM, 1M TPM)
 */
async function testGemini() {
  logInfo('🧪 Testando Google Gemini API (Free Tier)...');
  
  // Nota: O usuário mencionou que quer modelos sem chaves, 
  // mas o Gemini Free é a melhor alternativa estável.
  // Vou apenas verificar se a estrutura de chamada está pronta.
  
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    logError('❌ GEMINI_API_KEY não configurada no .env');
    return;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: "Resuma em uma frase quem é Nikolas Ferreira." }] }]
      }
    );
    
    logInfo('✅ Sucesso com Gemini 1.5 Flash');
    console.log('Resposta:', response.data.candidates[0].content.parts[0].text);
  } catch (error: any) {
    logError(`❌ Falha no Gemini: ${error.message}`);
  }
}

testGemini();
