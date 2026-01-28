
import { aiService } from '../services/ai.service.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import dotenv from 'dotenv';
dotenv.config();

async function testArchitecture() {
  logInfo('🚀 Testando Arquitetura Seth VII v3.2...');

  const sampleText = `
    O deputado Nikolas Ferreira afirmou em entrevista ao G1 que pretende destinar R$ 2 milhões para a saúde de Belo Horizonte.
    Ele também criticou o governo federal, dizendo que "a gestão atual é um desastre econômico".
    No entanto, dados da Câmara mostram que ele votou a favor de 90% das pautas do governo no último mês.
  `;

  try {
    logInfo('--- TESTE 1: Análise Estruturada (analyzeText) ---');
    const result = await aiService.analyzeText(sampleText);
    console.log('Resultado Normalizado:', JSON.stringify(result, null, 2));

    if (result.promises.length > 0) {
      logInfo('✅ Sucesso: Promessas extraídas e normalizadas.');
    } else {
      logWarn('⚠️ Aviso: Nenhuma promessa extraída, mas a estrutura está íntegra.');
    }

    logInfo('--- TESTE 2: Geração de Relatório (generateReport) ---');
    const report = await aiService.generateReport('Gere um resumo forense sobre Nikolas Ferreira.');
    console.log('Relatório Gerado:', report.substring(0, 200) + '...');
    
    if (!report.includes('FALHA NA GERAÇÃO')) {
      logInfo('✅ Sucesso: Relatório gerado com sucesso.');
    }

  } catch (error: any) {
    logError(`❌ Falha crítica no teste de arquitetura: ${error.message}`);
  }
}

testArchitecture();
