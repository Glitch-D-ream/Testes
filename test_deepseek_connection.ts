
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testDeepSeek() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('Chave encontrada:', apiKey ? 'Sim (começa com ' + apiKey.substring(0, 10) + '...)' : 'Não');

  if (!apiKey) {
    console.error('Erro: OPENROUTER_API_KEY não configurada no .env');
    process.exit(1);
  }

  try {
    console.log('Enviando requisição para OpenRouter (DeepSeek R1)...');
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-r1',
      messages: [
        { role: 'system', content: 'Você é um assistente útil.' },
        { role: 'user', content: 'Diga "Conexão estabelecida com sucesso!" se você estiver funcionando.' }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      max_tokens: 100,
      timeout: 30000
    });

    console.log('Resposta recebida:');
    console.log(JSON.stringify(response.data.choices[0].message.content, null, 2));
    console.log('\n✅ Teste de conexão concluído com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro na conexão:', error.response?.data || error.message);
    process.exit(1);
  }
}

testDeepSeek();
