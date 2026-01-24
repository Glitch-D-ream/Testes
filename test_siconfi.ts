
import { getBudgetData, validateBudgetViability } from './server/integrations/siconfi.js';
import { logInfo } from './server/core/logger.js';

async function testSiconfi() {
  console.log('🏛️  Testando Integração com o Tesouro Nacional (SICONFI)...\n');

  const category = 'SAUDE';
  const year = 2023;

  try {
    console.log(`🔍 Buscando orçamento de ${category} para o ano ${year}...`);
    const data = await getBudgetData(category, year, 'FEDERAL');
    
    if (data) {
      console.log('✅ Dados obtidos com sucesso!');
      console.log(`💰 Orçado: R$ ${data.budgeted.toLocaleString('pt-BR')}`);
      console.log(`📉 Executado: R$ ${data.executed.toLocaleString('pt-BR')}`);
      console.log(`📊 Taxa de Execução: ${data.percentage}%`);

      console.log('\n⚖️  Testando Validação de Viabilidade...');
      const viability = await validateBudgetViability(category, 500000000, year, 'FEDERAL');
      console.log(`🤔 Resultado: ${viability.viable ? 'VIÁVEL' : 'INVIÁVEL'}`);
      console.log(`📝 Motivo: ${viability.reason}`);
    } else {
      console.log('❌ Não foi possível obter dados do SICONFI.');
    }
  } catch (error) {
    console.error('💥 Erro no teste do SICONFI:', error);
  }
}

testSiconfi();
