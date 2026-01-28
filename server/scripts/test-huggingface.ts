
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Teste de integração com Hugging Face Inference API (Sem Chave/Public)
 * Nota: Algumas APIs públicas do HF permitem chamadas limitadas sem token
 */
async function testHuggingFace() {
  logInfo('🧪 Testando Hugging Face Inference API (Public)...');
  
  const models = [
    'sentence-transformers/all-MiniLM-L6-v2', // Para embeddings/similaridade
    'facebook/bart-large-cnn',               // Para sumarização
    'dbmdz/bert-large-cased-finetuned-conll03-english' // Para NER
  ];

  for (const model of models) {
    try {
      logInfo(`Tentando modelo: ${model}`);
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: "Nikolas Ferreira is a Brazilian politician." },
        { timeout: 10000 }
      );
      
      logInfo(`✅ Sucesso com ${model}`);
      console.log(JSON.stringify(response.data).substring(0, 100) + '...');
    } catch (error: any) {
      logError(`❌ Falha no modelo ${model}: ${error.message}`);
    }
  }
}

testHuggingFace();
