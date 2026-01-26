
import { BrainAgent } from '../agents/brain.ts';
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

/**
 * Script de Teste para Validar a Análise de Contraste e Extração de Projetos
 */
async function testBrainContrast() {
  logInfo('🧪 Iniciando Teste de Validação do Brain Agent (Melhorias ChatGPT)...');

  try {
    await initializeDatabase();
    const brain = new BrainAgent();

    const politicianName = 'Erika Hilton';
    const mockSources = [
      {
        url: 'https://exemplo.com/noticia',
        title: 'Erika Hilton defende direitos LGBTQIA+ e habitação popular',
        content: 'A deputada Erika Hilton (PSOL-SP) reafirmou seu compromisso com a criação de centros de acolhimento e programas de habitação para pessoas trans.',
        source: 'Mock News',
        relevanceScore: 0.9
      }
    ];

    logInfo(`[Teste] Executando análise profunda para: ${politicianName}`);
    
    // Executar análise (ignoreCache: true para forçar nova análise com as melhorias)
    const result = await brain.analyze(politicianName, mockSources, null, null, true);

    logInfo('✅ Análise concluída com sucesso!');
    logInfo('--- RESULTADOS DA MELHORIA ---');
    logInfo(`Político: ${result.politicianName}`);
    logInfo(`Categoria Principal: ${result.mainCategory}`);
    
    logInfo('\n📊 ANÁLISE DE CONTRASTE:');
    logInfo(`Score de Ausência: ${result.contrastAnalysis.negativeEvidenceScore}/100`);
    logInfo(`Explicação: ${result.contrastAnalysis.details.explanation}`);
    
    logInfo('\n📜 PROMESSAS TÉCNICAS (Extraídas de PLs):');
    if (result.technicalPromises && result.technicalPromises.length > 0) {
      result.technicalPromises.forEach((p: any, i: number) => {
        logInfo(`${i+1}. [${p.projectTitle}] ${p.text}`);
      });
    } else {
      logInfo('Nenhuma promessa técnica extraída.');
    }

    logInfo('\n--- FIM DO TESTE ---');
    process.exit(0);
  } catch (error) {
    logError('❌ Erro no teste de validação:', error as Error);
    process.exit(1);
  }
}

testBrainContrast();
