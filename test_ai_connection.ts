
import axios from 'axios';

async function testAI() {
  console.log('🤖 Testando conexão com a IA (Pollinations)...');
  
  const testPrompt = "Olá! Você é um analista político. Por favor, identifique se esta frase é uma promessa política: 'Vou construir 50 novas escolas em 2026'. Responda apenas com um JSON: {\"isPromise\": true/false}";

  try {
    const response = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'system', content: 'Você é um assistente que responde apenas em JSON válido.' },
        { role: 'user', content: testPrompt }
      ],
      model: 'openai',
      jsonMode: true
    }, { timeout: 20000 });

    console.log('\n📡 Resposta da API recebida!');
    console.log('Status:', response.status);
    
    let content = response.data;
    console.log('Conteúdo Bruto:', content);

    if (typeof content === 'string') {
      content = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    }

    if (content && typeof content.isPromise === 'boolean') {
      console.log('\n✅ SUCESSO: A IA está funcionando corretamente e retornando o formato esperado!');
      console.log('Resultado da Análise:', content.isPromise ? 'É uma promessa' : 'Não é uma promessa');
    } else {
      console.log('\n⚠️ AVISO: A IA respondeu, mas o formato não foi exatamente o esperado.');
    }

  } catch (error: any) {
    console.error('\n❌ ERRO ao conectar com a IA:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Mensagem:', error.message);
    }
    console.log('\n💡 Dica: Verifique se o sandbox tem acesso à internet ou se a API do Pollinations está instável.');
  }
}

testAI();
