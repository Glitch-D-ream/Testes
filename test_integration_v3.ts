import { scoutAgent } from './server/agents/scout.js';
import { filterAgent } from './server/agents/filter.js';
import { brainAgent } from './server/agents/brain.js';
import { cacheService } from './server/services/cache.service.js';
import { temporalIncoherenceService } from './server/services/temporal-incoherence.service.js';
import { dossierFormatterService } from './server/services/dossier-formatter.service.js';
import { logInfo, logError } from './server/core/logger.js';

/**
 * Teste de Integração v3.0: Valida a Tríade completa com todas as melhorias
 */
async function runIntegrationTest() {
  logInfo('='.repeat(80));
  logInfo('TESTE DE INTEGRAÇÃO v3.0 - DETECTOR DE PROMESSA VAZIA');
  logInfo('='.repeat(80));

  try {
    const testPolitician = 'Lula';
    
    // Fase 1: Scout Agent (com Multi-Scout resiliente)
    logInfo(`\n[TESTE 1] Scout Agent - Buscando fontes para: ${testPolitician}`);
    const sources = await scoutAgent.search(testPolitician);
    logInfo(`✅ Scout encontrou ${sources.length} fontes`);
    
    if (sources.length === 0) {
      logError('❌ Scout não encontrou fontes. Abortando teste.');
      return;
    }

    // Fase 2: Filter Agent
    logInfo(`\n[TESTE 2] Filter Agent - Filtrando ${sources.length} fontes`);
    const filteredSources = await filterAgent.filter(sources, testPolitician);
    logInfo(`✅ Filter retornou ${filteredSources.length} fontes relevantes`);

    // Fase 3: Verificar Cache
    logInfo(`\n[TESTE 3] Cache Service - Verificando cache para: ${testPolitician}`);
    const cachedAnalysis = await cacheService.getAnalysis(testPolitician);
    if (cachedAnalysis) {
      logInfo(`✅ Análise encontrada em cache (reutilizando)`);
    } else {
      logInfo(`ℹ️ Análise não em cache (será gerada)`);
    }

    // Fase 4: Brain Agent (com Análise de Incoerência Temporal)
    logInfo(`\n[TESTE 4] Brain Agent - Analisando ${filteredSources.length} fontes`);
    const analysis = await brainAgent.analyze(testPolitician, filteredSources);
    logInfo(`✅ Brain completou análise`);

    // Fase 5: Temporal Incoherence Service
    logInfo(`\n[TESTE 5] Temporal Incoherence - Detectando contradições`);
    const promiseTexts = filteredSources.map(s => s.content);
    const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(testPolitician, promiseTexts);
    logInfo(`✅ Análise temporal concluída - Coerência: ${temporalAnalysis.coherenceScore}%`);
    if (temporalAnalysis.contradictions.length > 0) {
      logInfo(`   ⚠️ ${temporalAnalysis.contradictions.length} contradição(ões) detectada(s)`);
    }

    // Fase 6: Dossier Formatter
    logInfo(`\n[TESTE 6] Dossier Formatter - Formatando dossiê`);
    const formattedDossier = dossierFormatterService.formatDossier({
      politicianName: testPolitician,
      category: 'Geral',
      budgetViability: analysis.budgetViability,
      temporalAnalysis: temporalAnalysis,
      promises: analysis.promises || [],
      sources: filteredSources,
      probabilityScore: analysis.probabilityScore?.score || 0
    });
    logInfo(`✅ Dossiê formatado (${formattedDossier.length} caracteres)`);

    // Fase 7: Cache Service - Salvar
    logInfo(`\n[TESTE 7] Cache Service - Salvando análise em cache`);
    const saved = await cacheService.saveAnalysis(testPolitician, analysis);
    logInfo(`✅ Análise ${saved ? 'salva' : 'não salva'} em cache`);

    // Fase 8: Cache Service - Estatísticas
    logInfo(`\n[TESTE 8] Cache Service - Obtendo estatísticas`);
    const stats = await cacheService.getStats();
    logInfo(`✅ Cache Statistics:`);
    logInfo(`   - Total em cache: ${stats.totalCached}`);
    logInfo(`   - Total de hits: ${stats.totalHits}`);
    logInfo(`   - Média de hits/análise: ${stats.avgHitsPerAnalysis.toFixed(2)}`);

    logInfo('\n' + '='.repeat(80));
    logInfo('✅ TESTE DE INTEGRAÇÃO v3.0 CONCLUÍDO COM SUCESSO');
    logInfo('='.repeat(80));

    // Exibir amostra do dossiê formatado
    logInfo('\n📄 AMOSTRA DO DOSSIÊ FORMATADO:');
    logInfo(formattedDossier.substring(0, 500) + '...\n');

  } catch (error) {
    logError('❌ TESTE DE INTEGRAÇÃO FALHOU', error as Error);
    process.exit(1);
  }
}

// Executar teste
runIntegrationTest().catch(console.error);
