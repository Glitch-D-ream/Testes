import axios from 'axios';

async function test() {
  console.log('--- TESTE DIRETO POLLINATIONS ---');
  const model = 'openai'; // Pollinations usa 'openai' como alias para o modelo padrão
  const prompt = encodeURIComponent("Olá, responda apenas 'OK'");
  const url = `https://text.pollinations.ai/${prompt}?model=${model}`;

  try {
    console.log(`Chamando: ${url}`);
    const res = await axios.get(url, { timeout: 15000 });
    console.log('Resposta:', res.data);
  } catch (err: any) {
    console.error('Erro:', err.message);
  }
}

test();
