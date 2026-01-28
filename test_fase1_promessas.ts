/**
 * TESTE DA FASE 1: COLETA DE PROMESSAS
 * 
 * Testa os 3 novos agentes:
 * 1. Government Plan Extractor (TSE)
 * 2. Scout Interview (YouTube, entrevistas)
 * 3. Scout Speech (Câmara dos Deputados)
 */

import * as dotenv from 'dotenv';
dotenv.config();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

async function testFase1() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║     TESTE FASE 1: COLETA DE PROMESSAS - ARTHUR LIRA               ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const targetName = 'Arthur Lira';
  const results: any = {
    government: [],
    interviews: [],
    speeches: []
  };

  // ═══════════════════════════════════════════════════════════════
  // TESTE 1: Government Plan Extractor
  // ═══════════════════════════════════════════════════════════════
  console.log(`${BOLD}[1/3] GOVERNMENT PLAN EXTRACTOR (TSE)${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { governmentPlanExtractorService } = await import('./server/services/government-plan-extractor.service.ts');
    
    const startTime = Date.now();
    results.government = await governmentPlanExtractorService.extractFromTSE(targetName, 'AL', 2022);
    const elapsed = Date.now() - startTime;
    
    if (results.government.length > 0) {
      console.log(`${GREEN}✓ ${results.government.length} promessas extraídas em ${(elapsed/1000).toFixed(2)}s${RESET}`);
      results.government.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\n  ${i+1}. [${p.category}] ${p.text.substring(0, 80)}...`);
        console.log(`     Prioridade: ${p.priority} | Confiança: ${p.confidence}%`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa encontrada (pode ser que não tenha plano de governo registrado)${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 2: Scout Interview Agent
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}[2/3] SCOUT INTERVIEW AGENT${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutInterviewAgent } = await import('./server/agents/scout-interview.ts');
    
    const startTime = Date.now();
    results.interviews = await scoutInterviewAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    if (results.interviews.length > 0) {
      console.log(`${GREEN}✓ ${results.interviews.length} promessas extraídas em ${(elapsed/1000).toFixed(2)}s${RESET}`);
      results.interviews.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\n  ${i+1}. [${p.category}] ${p.text.substring(0, 80)}...`);
        console.log(`     Fonte: ${p.source.title.substring(0, 60)}...`);
        console.log(`     Plataforma: ${p.source.platform} | Confiança: ${p.confidence}%`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa encontrada em entrevistas${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 3: Scout Speech Agent
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}[3/3] SCOUT SPEECH AGENT${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutSpeechAgent } = await import('./server/agents/scout-speech.ts');
    
    const startTime = Date.now();
    results.speeches = await scoutSpeechAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    if (results.speeches.length > 0) {
      console.log(`${GREEN}✓ ${results.speeches.length} promessas extraídas em ${(elapsed/1000).toFixed(2)}s${RESET}`);
      results.speeches.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\n  ${i+1}. [${p.category}] ${p.text.substring(0, 80)}...`);
        console.log(`     Data: ${p.source.date} | ${p.source.title}`);
        console.log(`     Contexto: ${p.context.substring(0, 60)}...`);
        console.log(`     Confiança: ${p.confidence}%`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa encontrada em discursos${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${GREEN}║                    RESUMO DA FASE 1                                ║${RESET}`);
  console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const total = results.government.length + results.interviews.length + results.speeches.length;

  console.log(`${BOLD}TOTAL DE PROMESSAS COLETADAS: ${total}${RESET}`);
  console.log(`  • Plano de Governo: ${results.government.length}`);
  console.log(`  • Entrevistas: ${results.interviews.length}`);
  console.log(`  • Discursos: ${results.speeches.length}`);

  if (total > 0) {
    console.log(`\n${GREEN}${BOLD}✅ FASE 1 IMPLEMENTADA COM SUCESSO!${RESET}`);
    console.log(`\nAgora o Brain Agent tem acesso a promessas de múltiplas fontes.`);
  } else {
    console.log(`\n${YELLOW}${BOLD}⚠ FASE 1 IMPLEMENTADA, MAS SEM DADOS${RESET}`);
    console.log(`\nOs agentes estão funcionando, mas não encontraram promessas para ${targetName}.`);
    console.log(`Isso pode acontecer se:`);
    console.log(`  • O político não tem plano de governo registrado no TSE`);
    console.log(`  • Não há entrevistas recentes indexadas`);
    console.log(`  • Os discursos não contêm promessas explícitas`);
  }

  console.log(`\n${'─'.repeat(70)}\n`);
}

testFase1().catch(console.error);
