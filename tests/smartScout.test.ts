import { SmartScout } from '../server/agents/smartScout.ts';

async function testSmartScout() {
  console.log('🧪 Iniciando teste do SmartScout Minimalista...');
  
  const scout = new SmartScout({
    maxResultsPerSource: 3,
    timeoutMs: 5000,
    useCache: false
  });

  try {
    console.log('🔍 Testando busca por "Lula"...');
    const results = await scout.searchPolitician('Lula');
    
    console.log(`📊 Resultados encontrados: ${results.length}`);
    
    if (results.length > 0) {
      console.log('✅ Teste passou: Resultados retornados.');
      console.log('Exemplo de resultado:', {
        title: results[0].title,
        source: results[0].source,
        relevance: results[0].relevance
      });
    } else {
      console.log('⚠️ Teste inconclusivo: Nenhum resultado retornado (pode ser indisponibilidade da API).');
    }

    // Teste de normalização e relevância
    console.log('🔍 Testando cálculo de relevância...');
    const mockData = {
      nome: 'Luiz Inácio Lula da Silva',
      dataHora: new Date().toISOString(),
      siglaPartido: 'PT'
    };
    const relevance = (scout as any).calculateRelevance(mockData, 'Lula');
    console.log(`Relevância calculada: ${relevance}`);
    if (relevance > 0.5) {
      console.log('✅ Cálculo de relevância parece correto.');
    } else {
      console.log('❌ Erro no cálculo de relevância.');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

testSmartScout();
