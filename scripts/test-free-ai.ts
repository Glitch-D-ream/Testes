import { aiService } from '../server/services/ai.service.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAI() {
  console.log('--- Testando IA Gratuita (Pollinations/Llama) ---');
  
  const text = `
    O candidato João Silva prometeu em seu discurso ontem que, se eleito, 
    irá construir 50 novas escolas técnicas em todo o estado até o final de 2026. 
    Ele também afirmou que não irá aumentar nenhum imposto durante seu mandato.
  `;

  try {
    console.log('Enviando texto para análise...');
    const result = await aiService.analyzeText(text);
    console.log('\nResultado da Análise:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.promises && result.promises.length > 0) {
      console.log('\n✅ Teste bem-sucedido! Promessas extraídas corretamente.');
    } else {
      console.log('\n⚠️ Nenhuma promessa extraída. Verifique o prompt ou a resposta da IA.');
    }
  } catch (error) {
    console.error('\n❌ Erro no teste de IA:', error);
  }
}

testAI();
