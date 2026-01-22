
import dotenv from 'dotenv';
import { AIService } from './server/services/ai.service.js';
import OpenAI from 'openai';

dotenv.config();

async function runComparison() {
  const aiService = new AIService();
  const sampleText = "Eu prometo que vou construir 50 novas escolas em São Paulo até o final de 2026 e reduzir o desemprego em 10%.";
  const prompt = (aiService as any).promptTemplate(sampleText);

  // Usando o cliente OpenAI do Manus que suporta múltiplos modelos
  const manusClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const models = [
    { name: 'Gemini 2.5 Flash', id: 'gemini-2.5-flash' },
    { name: 'GPT-4.1 Mini', id: 'gpt-4.1-mini' },
    { name: 'GPT-4.1 Nano', id: 'gpt-4.1-nano' }
  ];

  console.log('=== TESTE COMPARATIVO DE ANÁLISE DE PROMESSAS ===');
  console.log(`Texto: "${sampleText}"\n`);

  const results: any[] = [];

  for (const model of models) {
    try {
      console.log(`Testando ${model.name}...`);
      const start = Date.now();
      const response = await manusClient.chat.completions.create({
        model: model.id,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });
      const duration = Date.now() - start;
      
      let content = response.choices[0]?.message?.content || '{}';
      // Limpar markdown se necessário
      if (content.startsWith('```json')) {
        content = content.replace(/```json\n?/, '').replace(/\n?```/, '');
      }
      
      const data = JSON.parse(content);
      results.push({
        model: model.name,
        duration: `${(duration / 1000).toFixed(2)}s`,
        promisesCount: data.promises?.length || 0,
        sentiment: data.overallSentiment,
        score: data.credibilityScore,
        data: data
      });
      console.log(`✅ ${model.name} concluído em ${(duration / 1000).toFixed(2)}s`);
    } catch (error: any) {
      console.error(`❌ Erro em ${model.name}:`, error.message);
    }
  }

  console.log('\n=== RESULTADOS COMPARATIVOS ===\n');
  console.table(results.map(r => ({
    Modelo: r.model,
    Tempo: r.duration,
    Promessas: r.promisesCount,
    Sentimento: typeof r.sentiment === 'string' ? r.sentiment.substring(0, 30) + '...' : r.sentiment,
    Credibilidade: r.score
  })));

  // Detalhes das promessas para comparação qualitativa
  console.log('\n=== DETALHES DAS PROMESSAS POR MODELO ===');
  results.forEach(r => {
    console.log(`\n> ${r.model}:`);
    r.data.promises.forEach((p: any, i: number) => {
      console.log(`  ${i+1}. [${p.category}] ${p.text}`);
      console.log(`     Confiança: ${p.confidence} | Raciocínio: ${p.reasoning}`);
    });
  });
}

runComparison().catch(console.error);
