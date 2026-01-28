/**
 * Teste Completo do Fluxo da Tríade Seth VII
 * Executa: Brain → Scout → Filter → Agentes Especializados → IA → Persistência
 */
import { brainAgent } from '../agents/brain.ts';
import { initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testBrainAnalysis() {
  const startTime = Date.now();
  
  logInfo('═══════════════════════════════════════════════════════════════');
  logInfo('       TESTE COMPLETO: TRÍADE SETH VII - JONES MANOEL          ');
  logInfo('═══════════════════════════════════════════════════════════════');
  
  try {
    // 1. Inicializar banco de dados
    logInfo('[SETUP] Inicializando conexão com Supabase...');
    await initializeDatabase();
    logInfo('[SETUP] Supabase conectado!');
    
    // 2. Executar análise completa via BrainAgent
    logInfo('[BRAIN] Iniciando análise profunda para: Jones Manoel');
    logInfo('[BRAIN] Isso pode levar alguns minutos...');
    logInfo('');
    
    const result = await brainAgent.analyze('Jones Manoel', null, null);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // 3. Exibir resultados
    logInfo('');
    logInfo('═══════════════════════════════════════════════════════════════');
    logInfo(`       ANÁLISE CONCLUÍDA EM ${elapsed} SEGUNDOS                `);
    logInfo('═══════════════════════════════════════════════════════════════');
    logInfo('');
    
    // Perfil identificado
    if (result.politicianName) {
      logInfo(`[PERFIL] Nome: ${result.politicianName}`);
      logInfo(`[PERFIL] Cargo: ${result.politician?.office || 'N/A'}`);
      logInfo(`[PERFIL] Partido: ${result.politician?.party || 'N/A'}`);
      logInfo(`[PERFIL] Estado: ${result.politician?.state || 'N/A'}`);
    }
    
    // Relatório de Ausência
    if (result.absenceReport) {
      logInfo('');
      logInfo('[AUSÊNCIA] Relatório de Ausências:');
      logInfo(JSON.stringify(result.absenceReport, null, 2));
    }
    
    // Relatório de Vulnerabilidades
    if (result.vulnerabilityReport) {
      logInfo('');
      logInfo('[VULNERABILIDADE] Relatório de Vulnerabilidades:');
      logInfo(`  - Total de evidências: ${result.vulnerabilityReport.evidences?.length || 0}`);
    }
    
    // Benchmarking
    if (result.benchmarkResult) {
      logInfo('');
      logInfo('[BENCHMARK] Comparação com Pares:');
      logInfo(JSON.stringify(result.benchmarkResult, null, 2));
    }
    
    // Evidências coletadas
    if (result.evidences && result.evidences.length > 0) {
      logInfo('');
      logInfo(`[EVIDÊNCIAS] Total coletadas: ${result.evidences.length}`);
      result.evidences.slice(0, 3).forEach((e: any, i: number) => {
        logInfo(`  [${i+1}] ${e.statement?.substring(0, 100) || 'N/A'}...`);
      });
    }
    
    // Métricas de Consenso
    if (result.consensusMetrics) {
      logInfo('');
      logInfo('[CONSENSO] Métricas:');
      logInfo(`  - Fontes brutas: ${result.consensusMetrics.sourceCount}`);
      logInfo(`  - Fontes verificadas: ${result.consensusMetrics.verifiedCount}`);
    }
    
    // Data Lineage
    if (result.dataLineage) {
      logInfo('');
      logInfo('[LINEAGE] Origem dos Dados:');
      Object.entries(result.dataLineage).forEach(([key, value]) => {
        logInfo(`  - ${key}: ${value}`);
      });
    }
    
    logInfo('');
    logInfo('═══════════════════════════════════════════════════════════════');
    logInfo('                    TESTE CONCLUÍDO COM SUCESSO                 ');
    logInfo('═══════════════════════════════════════════════════════════════');
    
  } catch (error) {
    logError('ERRO FATAL NO TESTE:', error as Error);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

testBrainAnalysis();
