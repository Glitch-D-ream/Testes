
import { deepAuditor } from '../server/modules/auditor.js';
import { logInfo } from '../server/core/logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function runDeepAudit() {
  console.log('=== RELATÓRIO DE AUDITORIA PROFUNDA (DOSSIÊ) ===');
  console.log('Alvo: Nikolas Ferreira (Deputado Federal - PL/MG)');
  console.log('Promessa Analisada: "Vou garantir que o orçamento da educação básica seja dobrado até 2027."\n');

  try {
    const report = await deepAuditor.auditPromise(
      "Vou garantir que o orçamento da educação básica seja dobrado até 2027.",
      "Educação",
      "209787"
    );

    console.log(`VEREDITO: [${report.verdict}]`);
    console.log(`Score de Viabilidade: ${report.viabilityScore}%`);
    console.log(`\n--- Contexto Orçamentário (Dados Reais SICONFI) ---`);
    console.log(`Orçamento Total da Categoria: R$ ${(report.budgetContext.totalBudget / 1e9).toFixed(2)} Bilhões`);
    console.log(`Taxa de Execução Histórica: ${report.budgetContext.executionRate.toFixed(1)}%`);

    console.log(`\n--- Consistência Política (Dados da Câmara) ---`);
    console.log(`Votou contra o tema recentemente? ${report.politicalConsistency.votedAgainstTheme ? 'SIM ⚠️' : 'NÃO ✅'}`);
    console.log(`Votos Relevantes Identificados:`);
    report.politicalConsistency.relevantVotes.forEach(v => {
      console.log(`  - [${v.data}] ${v.tema}: Votou "${v.voto}" (${v.descricao})`);
    });

    console.log(`\n--- Explicação para o Cidadão ---`);
    console.log(report.explanation);

    console.log('\n================================================');
  } catch (error) {
    console.error('Erro na auditoria:', error);
  }
}

runDeepAudit().catch(console.error);
