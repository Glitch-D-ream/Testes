
import { votingService } from '../server/services/voting.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRealVoting() {
  console.log('--- Testando Auditoria de Votações REAL (API da Câmara) ---');
  const nikolasId = "209787"; // ID oficial do Nikolas Ferreira
  
  try {
    console.log('Buscando votos reais do Nikolas Ferreira...');
    const result = await votingService.checkInconsistency(nikolasId, 'EDUCAÇÃO');
    
    console.log(`\nResultado para Categoria: EDUCAÇÃO`);
    console.log(`Inconsistência Detectada: ${result.votedAgainst ? 'SIM ⚠️' : 'NÃO ✅'}`);
    console.log(`Votos Relevantes Encontrados: ${result.relevantVotes.length}`);
    
    result.relevantVotes.forEach(v => {
      console.log(`  - [${v.data}] ${v.tema}: Votou "${v.voto}"`);
      console.log(`    Descrição: ${v.descricao.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('Erro no teste de votação:', error);
  }
}

testRealVoting().catch(console.error);
