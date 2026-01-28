
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const models = [
  'deepseek-r1',
  'qwen-qwq',
  'mistral-large',
  'llama-3.3-70b'
];

const testCases = [
  {
    name: "Extração JSON (Arthur Lira)",
    prompt: "Extraia promessas e valores do texto: 'O Deputado Arthur Lira prometeu R$ 50 milhões para hospitais em Alagoas, mas votou contra o projeto PL 123/2024 que ampliava o teto da saúde.' Responda APENAS JSON: {\"promessas\": [], \"contradicoes\": []}"
  },
  {
    name: "Raciocínio Adversarial",
    prompt: "Analise a contradição: Um político diz que defende a transparência, mas usa o 'orçamento secreto' para destinar verbas sem rastreabilidade. Qual o risco sistêmico aqui? Responda em tom de auditor forense."
  }
];

async function runBenchmark() {
  console.log("🚀 Iniciando Benchmark de IAs Orientais/Open-Source...");
  
  for (const model of models) {
    console.log(`\n--- Testando Modelo: ${model} ---`);
    for (const test of testCases) {
      console.log(`\n[Teste: ${test.name}]`);
      const start = Date.now();
      try {
        const response = await axios.post('https://text.pollinations.ai/', {
          messages: [{ role: 'user', content: test.prompt }],
          model: model,
          jsonMode: test.name.includes('JSON')
        }, { timeout: 30000 });
        
        const duration = (Date.now() - start) / 1000;
        console.log(`⏱️ Tempo: ${duration}s`);
        console.log(`📄 Resposta: ${typeof response.data === 'string' ? response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200)}...`);
      } catch (error: any) {
        console.error(`❌ Erro no modelo ${model}: ${error.message}`);
      }
    }
  }
}

runBenchmark();
