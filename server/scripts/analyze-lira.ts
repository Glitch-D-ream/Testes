
import { RelationshipMiner } from '../modules/relationship-miner.ts';
import { calculateProbabilityWithDetails } from '../modules/probability.ts';
import fs from 'fs';

async function analyze() {
  try {
    const raw = fs.readFileSync('/home/ubuntu/lira_results.json', 'utf8');
    const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.log('Erro: JSON não encontrado no arquivo.');
      return;
    }
    const results = JSON.parse(jsonMatch[0]);
    
    console.log('--- AUTOANÁLISE TÉCNICA: ARTHUR LIRA ---');
    
    let totalConns = 0;
    for (const source of results) {
      const conns = await RelationshipMiner.mineAndStore(source.content, source.url, 'arthur-lira-id');
      totalConns += conns.length;
    }
    console.log('Relacionamentos Extraídos:', totalConns);

    const prob = await calculateProbabilityWithDetails(results.map((r: any) => ({ text: r.content })), 'Arthur Lira', 'POLÍTICA');
    console.log('Score de Probabilidade:', prob.score.toFixed(2));
    console.log('Nível de Risco:', prob.riskLevel);
    console.log('Confiança dos Dados (Freshness):', prob.confidence.toFixed(2));
    
    console.log('--- FIM DA ANÁLISE ---');
  } catch (e) {
    console.error('Erro na análise:', e);
  }
}
analyze();
