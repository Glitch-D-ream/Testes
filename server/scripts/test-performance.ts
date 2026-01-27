
import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { logInfo } from '../core/logger.ts';
import { initializeDatabase } from '../core/database.ts';

async function runTest() {
  await initializeDatabase();
  
  const query = "Lula promessas educação 2026";
  
  logInfo('--- TESTE 1: Busca sem Cache (Fria) ---');
  const start1 = Date.now();
  const results1 = await scoutHybrid.search(query);
  const end1 = Date.now();
  logInfo(`Tempo Teste 1: ${(end1 - start1) / 1000}s | Fontes: ${results1.length}`);

  logInfo('--- TESTE 2: Busca com Cache (Quente) ---');
  const start2 = Date.now();
  const results2 = await scoutHybrid.search(query);
  const end2 = Date.now();
  logInfo(`Tempo Teste 2: ${(end2 - start2) / 1000}s | Fontes: ${results2.length}`);

  if ((end2 - start2) < (end1 - start1) / 2) {
    logInfo('✅ SUCESSO: O cache reduziu significativamente o tempo de resposta!');
  } else {
    logInfo('⚠️ AVISO: A diferença de tempo foi menor que o esperado.');
  }
}

runTest().catch(console.error);
