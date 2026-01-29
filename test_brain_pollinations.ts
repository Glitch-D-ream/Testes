import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE BRAIN AGENT (POLLINATIONS FALLBACK) ---');
  try {
    await initializeDatabase();
    
    // Simular dados coletados pelo Scout
    const mockAnalysisData = {
      targetName: 'Político de Teste',
      text: 'Eu prometo reduzir os impostos em 50% no primeiro ano de mandato e construir 100 novas escolas.',
      sources: [
        {
          title: 'Notícia de Teste',
          url: 'https://exemplo.com/noticia',
          content: 'O candidato afirmou que vai reduzir impostos e construir escolas.',
          source: 'Jornal Local',
          type: 'news'
        }
      ]
    };

    console.log('Iniciando análise com Brain Agent...');
    const startTime = Date.now();
    
    // Forçar o uso de um modelo que sabemos ser acessível via Pollinations se o DeepSeek falhar
    const result = await brainAgent.analyze(mockAnalysisData.targetName, mockAnalysisData.text, mockAnalysisData.sources);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Análise concluída em ${duration}s`);
    console.log('--- RESULTADO ---');
    console.log(result);
    
  } catch (error) {
    console.error('Erro no teste do Brain:', error);
  }
}

test();
