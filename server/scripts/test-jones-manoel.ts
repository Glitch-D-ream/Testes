
import { scoutHybrid } from '../agents/scout-hybrid.ts';
import { logInfo, logError } from '../core/logger.ts';
import { initializeDatabase } from '../core/database.ts';
import { brainAgent } from '../agents/brain.ts';

async function testJonesManoel() {
  logInfo('🚀 Iniciando Teste Completo: Jones Manoel');
  
  try {
    await initializeDatabase();
    
    const query = "Jones Manoel promessas e propostas políticas 2026";
    
    // 1. Fase de Coleta (Scout)
    logInfo('🔍 FASE 1: Coleta de Dados (ScoutHybrid)...');
    const startScout = Date.now();
    const sources = await scoutHybrid.search(query, true);
    const endScout = Date.now();
    logInfo(`✅ Coleta concluída em ${((endScout - startScout) / 1000).toFixed(2)}s. Fontes encontradas: ${sources.length}`);

    if (sources.length === 0) {
      logError('❌ Nenhuma fonte encontrada para Jones Manoel.');
      return;
    }

    // 2. Fase de Análise (Brain)
    logInfo('🧠 FASE 2: Análise de Inteligência (Brain)...');
    const startBrain = Date.now();
    
    // Simulando o fluxo do AnalysisService
    const analysis = await brainAgent.analyze(
      "Análise de propostas e viabilidade política de Jones Manoel para 2026",
      sources.map(s => ({
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

    // 3. Exibir Resultado
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO DE ANÁLISE: JONES MANOEL');
    console.log('='.repeat(50));
    console.log(`\n📝 PARECER TÉCNICO:\n${analysis.report}`);
    console.log('\n' + '='.repeat(50));
    console.log(`Score de Viabilidade: ${analysis.viabilityScore}%`);
    console.log(`Confiança: ${analysis.confidence}%`);
    console.log('='.repeat(50));

  } catch (error) {
    logError('❌ Erro durante o teste:', error as Error);
  }
}

testJonesManoel().catch(console.error);
