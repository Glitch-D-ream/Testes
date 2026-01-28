
import { RelationshipMiner } from '../modules/relationship-miner.ts';
import { calculateProbabilityWithDetails } from '../modules/probability.ts';
import fs from 'fs';
import { logInfo, logError } from '../core/logger.ts';

async function analyze() {
  try {
    const raw = fs.readFileSync('/home/ubuntu/lira_results.json', 'utf8');
    const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      logError('Erro: JSON não encontrado no arquivo.');
      return;
    }
    const results = JSON.parse(jsonMatch[0]);
    
    logInfo('--- AUTOANÁLISE TÉCNICA: ARTHUR LIRA ---');
    
    let totalConns = 0;
    for (const source of results) {
      const conns = await RelationshipMiner.mineAndStore(source.content, source.url, 'arthur-lira-id');
      totalConns += conns.length;
    }
    logInfo(`Relacionamentos Extraídos: ${totalConns}`);

    const prob = await calculateProbabilityWithDetails(results.map((r: any) => ({ text: r.content })), 'Arthur Lira', 'POLÍTICA');
    logInfo(`Score de Probabilidade: ${prob.score.toFixed(2)}`);
    logInfo(`Nível de Risco: ${prob.riskLevel}`);
    logInfo(`Confiança dos Dados (Freshness): ${prob.confidence.toFixed(2)}`);
    
    logInfo('--- FIM DA ANÁLISE ---');
  } catch (e) {
    logError('Erro na análise:', e as Error);
  }
}
analyze();
