
import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE DE CÉREBRO (MOCK DATA): ERIKA HILTON ---');
  try {
    await initializeDatabase();
    
    // Mock de dados para o Brain Agent processar
    const mockSources = [
      {
        title: "Erika Hilton apresenta projeto para renda básica",
        url: "https://exemplo.com/noticia1",
        content: "A deputada Erika Hilton (PSOL-SP) apresentou hoje um projeto de lei que visa criar uma renda básica para populações vulneráveis em São Paulo. O projeto foca em famílias com renda per capita inferior a 1/4 do salário mínimo.",
        source: "Folha de SP",
        type: "news",
        confidence: "high",
        credibilityLayer: "B"
      },
      {
        title: "Gastos de Gabinete - Erika Hilton",
        url: "https://camara.leg.br/deputados/erika-hilton",
        content: "Gastos parlamentares de Erika Hilton em 2025 totalizam R$ 350.000,00, com foco em divulgação de atividade parlamentar e consultorias técnicas.",
        source: "Câmara dos Deputados",
        type: "official",
        confidence: "high",
        credibilityLayer: "A"
      }
    ];

    console.log('Processando análise com dados mockados...');
    
    // Injetar dados mockados simulando o fim da fase do Scout
    // O brainAgent.analyze normalmente chama o scout, mas vamos ver se conseguimos testar a lógica interna
    // Para um teste real no sandbox, vamos usar o OpenRouter/Groq com o prompt do Brain
    
    const result = await brainAgent.analyze('Erika Hilton');
    
    console.log('\n--- RESULTADO DA ANÁLISE ---');
    console.log('Score:', result.coherenceAnalysis.overallScore);
    console.log('Veredito:', result.humanizedReport.substring(0, 1000));

  } catch (error) {
    console.error('Erro no teste mock:', error);
  }
}

test();
