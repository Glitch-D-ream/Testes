
import { getBudgetData, validateBudgetViability } from './server/integrations/siconfi.js';
import { logInfo } from './server/core/logger.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testSiconfiLive() {
  console.log('🏛️  Testando Conexão Real com SICONFI (Tesouro Nacional)...\n');

  const testCases = [
    { category: 'SAUDE', year: 2023, sphere: 'FEDERAL' as const },
    { category: 'EDUCACAO', year: 2023, sphere: 'FEDERAL' as const }
  ];

  for (const test of testCases) {
    try {
      console.log(`🔍 Tentando buscar dados de ${test.category} (${test.year})...`);
      const data = await getBudgetData(test.category, test.year, test.sphere);
      
      if (data) {
        console.log(`✅ Resposta recebida para ${test.category}!`);
        console.log(`💰 Valor Orçado: R$ ${data.budgeted.toLocaleString('pt-BR')}`);
        console.log(`📉 Valor Executado: R$ ${data.executed.toLocaleString('pt-BR')}`);
        console.log(`📊 Taxa: ${data.percentage}%`);
        console.log(`🕒 Última Atualização: ${data.lastUpdated}`);
        
        // Testar viabilidade
        console.log(`⚖️  Testando viabilidade para uma promessa de R$ 1 Bilhão...`);
        const viability = await validateBudgetViability(test.category, 1000000000, test.year, test.sphere);
        console.log(`🤔 Resultado: ${viability.viable ? 'VIÁVEL' : 'INVIÁVEL'}`);
        console.log(`📝 Motivo: ${viability.reason}\n`);
      } else {
        console.log(`❌ Falha: Nenhum dado retornado para ${test.category}.\n`);
      }
    } catch (error: any) {
      console.error(`💥 Erro ao testar ${test.category}:`, error.message);
    }
  }
}

testSiconfiLive();
