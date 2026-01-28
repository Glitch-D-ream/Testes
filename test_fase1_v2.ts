/**
 * TESTE DA FASE 1 v2: COLETA DE PROMESSAS (CORRIGIDO)
 * 
 * Testa os agentes corrigidos:
 * 1. Scout Interview v2 (com scraping real)
 * 2. Scout Speech v2 (com fallback para Google News)
 */

import * as dotenv from 'dotenv';
dotenv.config();

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

async function testFase1V2() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   TESTE FASE 1 v2: COLETA DE PROMESSAS (COM SCRAPING REAL)        ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const targetName = 'Arthur Lira';
  const results: any = {
    interviews: [],
    speeches: []
  };

  // ═══════════════════════════════════════════════════════════════
  // TESTE 1: Scout Interview Agent v2
  // ═══════════════════════════════════════════════════════════════
  console.log(`${BOLD}[1/2] SCOUT INTERVIEW AGENT v2 (COM SCRAPING REAL)${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutInterviewAgent } = await import('./server/agents/scout-interview.ts');
    
    const startTime = Date.now();
    results.interviews = await scoutInterviewAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    if (results.interviews.length > 0) {
      console.log(`${GREEN}✓ ${results.interviews.length} promessas extraídas em ${(elapsed/1000).toFixed(2)}s${RESET}`);
      
      results.interviews.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\n  ${BOLD}${i+1}. [${p.category}] ${p.text.substring(0, 100)}...${RESET}`);
        if (p.quote) {
          console.log(`     ${DIM}Citação: "${p.quote.substring(0, 80)}..."${RESET}`);
        }
        console.log(`     ${DIM}Fonte: ${p.source.platform} - ${p.source.title.substring(0, 50)}...${RESET}`);
        console.log(`     ${DIM}Conteúdo extraído: ${p.source.content?.length || 0} caracteres${RESET}`);
        console.log(`     ${DIM}Confiança: ${p.confidence}%${RESET}`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa encontrada em entrevistas${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
    console.log(e.stack);
  }

  // ═══════════════════════════════════════════════════════════════
  // TESTE 2: Scout Speech Agent v2
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}[2/2] SCOUT SPEECH AGENT v2 (COM FALLBACK NEWS)${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutSpeechAgent } = await import('./server/agents/scout-speech.ts');
    
    const startTime = Date.now();
    results.speeches = await scoutSpeechAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    if (results.speeches.length > 0) {
      console.log(`${GREEN}✓ ${results.speeches.length} promessas extraídas em ${(elapsed/1000).toFixed(2)}s${RESET}`);
      
      results.speeches.slice(0, 3).forEach((p: any, i: number) => {
        console.log(`\n  ${BOLD}${i+1}. [${p.category}] ${p.text.substring(0, 100)}...${RESET}`);
        if (p.quote) {
          console.log(`     ${DIM}Citação: "${p.quote.substring(0, 80)}..."${RESET}`);
        }
        console.log(`     ${DIM}Fonte: ${p.source.chamber} - ${p.source.session}${RESET}`);
        console.log(`     ${DIM}Conteúdo extraído: ${p.source.content?.length || 0} caracteres${RESET}`);
        console.log(`     ${DIM}Confiança: ${p.confidence}%${RESET}`);
      });
    } else {
      console.log(`${YELLOW}⚠ Nenhuma promessa encontrada em discursos${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
    console.log(e.stack);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${GREEN}║                    RESUMO DA FASE 1 v2                             ║${RESET}`);
  console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const total = results.interviews.length + results.speeches.length;

  console.log(`${BOLD}TOTAL DE PROMESSAS COLETADAS: ${total}${RESET}`);
  console.log(`  • Entrevistas (com scraping): ${results.interviews.length}`);
  console.log(`  • Discursos/Declarações: ${results.speeches.length}`);

  // Verificar qualidade
  const withQuotes = [...results.interviews, ...results.speeches].filter((p: any) => p.quote && p.quote.length > 10).length;
  const withContent = [...results.interviews, ...results.speeches].filter((p: any) => p.source.content && p.source.content.length > 500).length;

  console.log(`\n${BOLD}QUALIDADE DOS DADOS:${RESET}`);
  console.log(`  • Com citação direta: ${withQuotes}/${total}`);
  console.log(`  • Com conteúdo real (>500 chars): ${withContent}/${total}`);

  if (total > 0 && withContent > 0) {
    console.log(`\n${GREEN}${BOLD}✅ FASE 1 v2 FUNCIONANDO CORRETAMENTE!${RESET}`);
    console.log(`\nAgora as promessas são extraídas do conteúdo real das páginas.`);
  } else if (total > 0) {
    console.log(`\n${YELLOW}${BOLD}⚠ FASE 1 v2 PARCIALMENTE FUNCIONAL${RESET}`);
    console.log(`\nPromessas encontradas, mas algumas sem conteúdo real.`);
  } else {
    console.log(`\n${RED}${BOLD}❌ FASE 1 v2 SEM RESULTADOS${RESET}`);
    console.log(`\nNenhuma promessa encontrada. Verificar logs acima.`);
  }

  console.log(`\n${'─'.repeat(70)}\n`);
}

testFase1V2().catch(console.error);
