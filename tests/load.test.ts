import { SmartScout } from '../server/agents/smartScout.ts';

async function runLoadTest() {
  console.log('📈 Iniciando teste de carga simulado...');
  const scout = new SmartScout({ useCache: true });
  const politician = 'Lula';
  const iterations = 20;
  const startTime = Date.now();

  console.log(`🚀 Executando ${iterations} buscas consecutivas para "${politician}"...`);

  for (let i = 1; i <= iterations; i++) {
    const start = Date.now();
    await scout.searchPolitician(politician);
    const duration = Date.now() - start;
    console.log(`Busca ${i}: ${duration}ms`);
  }

  const totalDuration = Date.now() - startTime;
  const avgDuration = totalDuration / iterations;
  const stats = scout.getCacheStats();

  console.log('\n📊 Estatísticas Finais:');
  console.log(`Duração Total: ${totalDuration}ms`);
  console.log(`Duração Média: ${avgDuration.toFixed(2)}ms`);
  console.log(`Cache Hits: ${stats.hits}`);
  console.log(`Cache Misses: ${stats.misses}`);
  console.log(`Cache Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);

  if (stats.hitRate > 0.8) {
    console.log('✅ Teste de carga passou: Cache hit rate > 80%.');
  } else {
    console.log('⚠️ Teste de carga: Cache hit rate abaixo do esperado.');
  }
}

runLoadTest();
