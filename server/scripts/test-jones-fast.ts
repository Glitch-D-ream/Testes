
import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { logInfo, logError } from '../core/logger.ts';
import { initializeDatabase } from '../core/database.ts';
import { brainAgent } from '../agents/brain.ts';

async function testJonesFast() {
  logInfo('🚀 Iniciando Teste Rápido: Jones Manoel');
  
  try {
    await initializeDatabase();
    
    // Query simplificada para garantir hit no cache ou busca rápida
    const query = "Jones Manoel";
    
    logInfo('🔍 FASE 1: Coleta de Dados...');
    const startScout = Date.now();
    // Usando busca normal (não deep) para ser mais rápido
    const sources = await scoutHybrid.search(query, false);
    const endScout = Date.now();
    logInfo(`✅ Coleta concluída em ${((endScout - startScout) / 1000).toFixed(2)}s. Fontes: ${sources.length}`);

    if (sources.length === 0) {
      logError('❌ Nenhuma fonte encontrada.');
      return;
    }

    logInfo('🧠 FASE 2: Análise de Inteligência...');
    const startBrain = Date.now();
    
    const analysis = await brainAgent.analyze(
      "Análise de perfil e propostas de Jones Manoel",
      sources.slice(0, 5).map(s => ({
        title: s.title,
        url: s.url,
        content: s.content,
        source: s.source,
        type: s.type,
        credibilityLayer: s.credibilityLayer
      }))
    );
    
    const endBrain = Date.now();
    logInfo(`✅ Análise concluída em ${((endBrain - startBrain) / 1000).toFixed(2)}s.`);

    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO SIMPLIFICADO: JONES MANOEL');
    console.log('='.repeat(50));
    console.log(`\n📝 PARECER:\n${analysis.report}`);
    console.log('\n' + '='.repeat(50));
    console.log(`Score: ${analysis.viabilityScore}% | Confiança: ${analysis.confidence}%`);
    console.log('='.repeat(50));

  } catch (error) {
    logError('❌ Erro:', error as Error);
  }
}

testJonesFast().catch(console.error);
