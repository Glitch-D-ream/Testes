
import { humanizerEngine } from './server/services/humanizer-engine.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('--- TESTE DE HUMANIZAÇÃO (SETTING: INCISIVO) ---');
  
  // Estrutura de dados real esperada pelo HumanizerEngine v4.1
  const mockAnalysisData = {
    targetName: "Erika Hilton",
    verdict: {
      reasoning: "A parlamentar apresenta uma atuação fortemente focada em pautas identitárias e direitos humanos, porém com baixa transparência em relação ao uso de consultorias externas.",
      mainFindings: [
        "Liderança em pautas LGBTQIA+ no Congresso",
        "Alta taxa de presença em sessões ordinárias",
        "Uso expressivo da cota parlamentar para consultoria técnica"
      ],
      contradictions: [
        "Prometeu redução de 20% nos gastos de gabinete, mas houve aumento de 5% no último semestre."
      ]
    },
    specialistReports: {
      finance: [
        { value: 150000, description: "Consultoria" },
        { value: 50000, description: "Divulgação" }
      ],
      absence: {
        absences: ["2025-03-10", "2025-04-15"]
      }
    },
    socialEvidences: [
      { content: "\"Nossa luta é por dignidade e renda básica para todos os brasileiros.\"", platform: "Twitter", url: "https://twitter.com/erikahilton" }
    ],
    sources: [
      { content: "A deputada afirmou que não recuará nas pautas de direitos civis.", source: "Folha de SP", url: "https://folha.uol.com.br" }
    ]
  };

  try {
    console.log('Gerando relatório humanizado...');
    const report = await humanizerEngine.humanize(mockAnalysisData);
    
    console.log('\n--- RELATÓRIO FINAL ---');
    console.log(report);
  } catch (error) {
    console.error('Erro na humanização:', error);
  }
}

test();
