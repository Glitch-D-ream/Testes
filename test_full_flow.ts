/**
 * TESTE COMPLETO DO FLUXO SETH VII
 * 
 * Este script testa o fluxo completo de análise política:
 * 1. Target Discovery - Identificação do político
 * 2. Scout - Coleta de fontes
 * 3. Filter - Filtragem de fontes relevantes
 * 4. AI Analysis - Análise via IA (Groq/OpenRouter)
 * 5. Correlator - Correlação de dados
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { logInfo, logError, logWarn } from './server/core/logger.ts';

// Cores para output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

async function testFullFlow() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║       TESTE COMPLETO DO FLUXO SETH VII - ANÁLISE LULA       ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  const results: Record<string, { success: boolean; data?: any; error?: string; time?: number }> = {};
  const targetName = 'Lula';

  // ═══════════════════════════════════════════════════════════════
  // TESTE 1: Target Discovery Service
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[1/6] TARGET DISCOVERY${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { targetDiscoveryService } = await import('./server/services/target-discovery.service.ts');
    const profile = await targetDiscoveryService.discover(targetName);
    const elapsed = Date.now() - startTime;
    
    results['targetDiscovery'] = { success: true, data: profile, time: elapsed };
    console.log(`${GREEN}✓ Alvo identificado em ${elapsed}ms${RESET}`);
    console.log(`  Nome: ${profile.name}`);
    console.log(`  Cargo: ${profile.office}`);
    console.log(`  Partido: ${profile.party}`);
    console.log(`  Estado: ${profile.state}`);
  } catch (error: any) {
    results['targetDiscovery'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 2: Scout Hybrid - Coleta de Fontes
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[2/6] SCOUT HYBRID - COLETA DE FONTES${RESET}`);
  console.log('─'.repeat(50));
  
  let rawSources: any[] = [];
  try {
    const startTime = Date.now();
    const { scoutHybrid } = await import('./server/agents/scout-hybrid.ts');
    const searchQuery = `Presidente Lula PT promessas governo 2024`;
    rawSources = await scoutHybrid.search(searchQuery, true);
    const elapsed = Date.now() - startTime;
    
    results['scoutHybrid'] = { success: rawSources.length > 0, data: { count: rawSources.length }, time: elapsed };
    
    if (rawSources.length > 0) {
      console.log(`${GREEN}✓ ${rawSources.length} fontes coletadas em ${elapsed}ms${RESET}`);
      rawSources.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i+1}. ${s.title?.substring(0, 60) || 'Sem título'}...`);
        console.log(`     URL: ${s.url?.substring(0, 50) || 'N/A'}...`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma fonte coletada${RESET}`);
    }
  } catch (error: any) {
    results['scoutHybrid'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 3: Filter Agent - Filtragem de Fontes
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[3/6] FILTER AGENT - FILTRAGEM${RESET}`);
  console.log('─'.repeat(50));
  
  let filteredSources: any[] = [];
  try {
    const startTime = Date.now();
    const { filterAgent } = await import('./server/agents/filter.ts');
    filteredSources = await filterAgent.filter(rawSources, true);
    const elapsed = Date.now() - startTime;
    
    results['filterAgent'] = { success: true, data: { input: rawSources.length, output: filteredSources.length }, time: elapsed };
    console.log(`${GREEN}✓ ${filteredSources.length}/${rawSources.length} fontes mantidas em ${elapsed}ms${RESET}`);
  } catch (error: any) {
    results['filterAgent'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 4: AI Resilience Nexus - Análise via IA
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[4/6] AI RESILIENCE NEXUS - ANÁLISE${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { aiResilienceNexus } = await import('./server/services/ai-resilience-nexus.ts');
    
    const analysisPrompt = `
Analise o político Lula (Presidente do Brasil) com base nas seguintes fontes coletadas:
${filteredSources.slice(0, 5).map(s => `- ${s.title}: ${s.content?.substring(0, 200) || 'N/A'}`).join('\n')}

Forneça uma análise técnica incluindo:
1. Principais promessas identificadas
2. Status de cumprimento
3. Contradições encontradas
4. Score de credibilidade (0-100)

Responda em JSON estruturado.`;

    const response = await aiResilienceNexus.chat(analysisPrompt);
    const elapsed = Date.now() - startTime;
    
    const isBlocked = response.content.toLowerCase().includes("sorry") && response.content.toLowerCase().includes("can't");
    
    results['aiNexus'] = { 
      success: !isBlocked && response.provider !== 'none', 
      data: { 
        provider: response.provider, 
        model: response.model,
        contentLength: response.content.length,
        blocked: isBlocked
      }, 
      time: elapsed 
    };
    
    if (!isBlocked && response.provider !== 'none') {
      console.log(`${GREEN}✓ Análise concluída via ${response.provider} (${response.model}) em ${elapsed}ms${RESET}`);
      console.log(`  Tamanho da resposta: ${response.content.length} caracteres`);
      console.log(`\n  ${CYAN}Prévia da análise:${RESET}`);
      console.log('  ' + response.content.substring(0, 500).replace(/\n/g, '\n  ') + '...');
    } else {
      console.log(`${RED}✗ Análise bloqueada ou falhou${RESET}`);
      console.log(`  Provider: ${response.provider}`);
    }
  } catch (error: any) {
    results['aiNexus'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 5: AI Service - Análise Estruturada (JSON)
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[5/6] AI SERVICE - ANÁLISE ESTRUTURADA${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { aiService } = await import('./server/services/ai.service.ts');
    
    const textToAnalyze = filteredSources.slice(0, 3).map(s => s.content || s.title).join('\n\n');
    const analysis = await aiService.analyzeText(textToAnalyze || 'Lula promete criar empregos e reduzir inflação');
    const elapsed = Date.now() - startTime;
    
    results['aiService'] = { 
      success: !analysis.error && analysis.promises?.length > 0, 
      data: { 
        promisesCount: analysis.promises?.length || 0,
        credibilityScore: analysis.credibilityScore,
        sentiment: analysis.overallSentiment
      }, 
      time: elapsed 
    };
    
    if (analysis.promises?.length > 0) {
      console.log(`${GREEN}✓ Análise estruturada em ${elapsed}ms${RESET}`);
      console.log(`  Promessas identificadas: ${analysis.promises.length}`);
      console.log(`  Score de credibilidade: ${analysis.credibilityScore}`);
      console.log(`  Sentimento: ${analysis.overallSentiment}`);
      console.log(`\n  ${CYAN}Promessas:${RESET}`);
      analysis.promises.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`  ${i+1}. ${p.text?.substring(0, 80) || 'N/A'}...`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa extraída${RESET}`);
      if (analysis.error) {
        console.log(`  Erro: ${analysis.message || 'Desconhecido'}`);
      }
    }
  } catch (error: any) {
    results['aiService'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 6: Data Correlator
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}[6/6] DATA CORRELATOR${RESET}`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const { dataCorrelator } = await import('./server/agents/correlator.ts');
    
    const correlations = await dataCorrelator.correlate({
      absence: null,
      vulnerability: { evidences: [] },
      financial: [],
      sources: filteredSources
    });
    const elapsed = Date.now() - startTime;
    
    results['correlator'] = { success: true, data: correlations, time: elapsed };
    console.log(`${GREEN}✓ Correlação concluída em ${elapsed}ms${RESET}`);
    console.log(`  Correlações encontradas: ${correlations?.length || 0}`);
  } catch (error: any) {
    results['correlator'] = { success: false, error: error.message };
    console.log(`${RED}✗ Falha: ${error.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║                    RESUMO DOS TESTES                        ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  const testNames: Record<string, string> = {
    targetDiscovery: 'Target Discovery',
    scoutHybrid: 'Scout Hybrid',
    filterAgent: 'Filter Agent',
    aiNexus: 'AI Resilience Nexus',
    aiService: 'AI Service',
    correlator: 'Data Correlator'
  };

  let passed = 0;
  let failed = 0;

  for (const [key, result] of Object.entries(results)) {
    const status = result.success ? `${GREEN}✓ PASSOU${RESET}` : `${RED}✗ FALHOU${RESET}`;
    const time = result.time ? `(${result.time}ms)` : '';
    console.log(`  ${testNames[key]}: ${status} ${time}`);
    
    if (result.success) passed++;
    else failed++;
    
    if (result.data) {
      console.log(`    ${JSON.stringify(result.data)}`);
    }
    if (result.error) {
      console.log(`    ${RED}Erro: ${result.error}${RESET}`);
    }
  }

  console.log(`\n${BOLD}RESULTADO: ${passed}/${passed + failed} testes passaram${RESET}`);
  
  if (failed === 0) {
    console.log(`\n${GREEN}${BOLD}✅ TODOS OS TESTES PASSARAM! O fluxo está funcionando.${RESET}\n`);
  } else {
    console.log(`\n${YELLOW}${BOLD}⚠ Alguns testes falharam. Verifique os erros acima.${RESET}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

testFullFlow().catch(console.error);
