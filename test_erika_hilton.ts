
import { brainAgent } from './server/agents/brain.ts';
import { initializeDatabase } from './server/core/database.ts';
import { logInfo } from './server/core/logger.ts';

async function testErikaHilton() {
  console.log('🚀 Iniciando Auditoria Seth VII v2.0: Erika Hilton');
  
  try {
    await initializeDatabase();
    
    // Executar análise completa (Scout -> Filter -> Brain)
    // Passamos ignoreCache: true para garantir que ele use o novo motor v2.0
    const result = await brainAgent.analyze('Erika Hilton');
    
    console.log('\n✅ Auditoria concluída com sucesso!');
    console.log('--- RESUMO ---');
    console.log(`Político: ${result.politicianName}`);
    console.log(`Cargo: ${result.politician.office}`);
    console.log(`Partido: ${result.politician.party}`);
    console.log(`Categoria Principal: ${result.mainCategory}`);
    console.log(`Alinhamento Partidário: ${result.partyAlignment}%`);
    console.log(`Contradições: ${result.contrastAnalysis}`);
  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error);
  }
}

testErikaHilton();
