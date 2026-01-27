
import { getDeputadoId, getVotacoesDeputado, getProposicoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability } from '../integrations/siconfi.ts';
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function test() {
  logInfo('🚀 Iniciando teste de integrações oficiais...');
  
  try {
    await initializeDatabase();
    
    const nome = 'Nikolas Ferreira';
    logInfo(`1. Testando Câmara para: ${nome}`);
    const id = await getDeputadoId(nome);
    logInfo(`ID encontrado: ${id}`);
    
    if (id) {
      const votacoes = await getVotacoesDeputado(id);
      logInfo(`Votações encontradas: ${votacoes.length}`);
      if (votacoes.length > 0) {
        console.log('Exemplo de votação:', JSON.stringify(votacoes[0], null, 2));
      }
      
      const proposicoes = await getProposicoesDeputado(id);
      logInfo(`Proposições encontradas: ${proposicoes.length}`);
    }
    
    logInfo('2. Testando SICONFI (Saúde, 2023, Federal)');
    const budget = await validateBudgetViability('SAUDE', 1000000, 2023, 'FEDERAL');
    logInfo(`Resultado SICONFI: ${budget.viable ? 'Viável' : 'Inviável'}`);
    console.log('Detalhes SICONFI:', JSON.stringify(budget, null, 2));
    
    process.exit(0);
  } catch (error) {
    logError('Erro no teste:', error as Error);
    process.exit(1);
  }
}

test();
