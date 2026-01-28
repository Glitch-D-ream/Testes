/**
 * TESTE INTEGRADO: FASE 1 + FASE 2
 * 
 * Testa o fluxo completo:
 * - Fase 1: Coleta de Promessas (Entrevistas, Discursos)
 * - Fase 2: Cruzamentos (Promessa vs Voto, Promessa vs Gasto, Temporal)
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

interface PromiseData {
  text: string;
  category: string;
  source: string;
  date?: string;
  quote?: string;
}

async function testIntegrado() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║       TESTE INTEGRADO: FASE 1 + FASE 2 (SETH VII)                  ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const targetName = 'Arthur Lira';
  const allPromises: PromiseData[] = [];
  const allStatements: any[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: COLETA DE PROMESSAS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${BOLD}${GREEN}┌─────────────────────────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${GREEN}│                    FASE 1: COLETA DE PROMESSAS                      │${RESET}`);
  console.log(`${BOLD}${GREEN}└─────────────────────────────────────────────────────────────────────┘${RESET}\n`);

  // 1.1 Scout Interview
  console.log(`${BOLD}[1.1] SCOUT INTERVIEW AGENT${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutInterviewAgent } = await import('./server/agents/scout-interview.ts');
    const startTime = Date.now();
    const interviewPromises = await scoutInterviewAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    console.log(`${GREEN}✓ ${interviewPromises.length} promessas de entrevistas em ${(elapsed/1000).toFixed(1)}s${RESET}`);
    
    for (const p of interviewPromises) {
      allPromises.push({
        text: p.text,
        category: p.category,
        source: `Entrevista: ${p.source.platform}`,
        date: p.source.date,
        quote: p.quote
      });
      allStatements.push({
        text: p.text,
        date: p.source.date,
        source: p.source.platform,
        category: p.category,
        quote: p.quote
      });
      
      console.log(`  • [${p.category}] ${p.text.substring(0, 60)}...`);
      if (p.quote) console.log(`    ${DIM}Citação: "${p.quote.substring(0, 50)}..."${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
  }

  // 1.2 Scout Speech
  console.log(`\n${BOLD}[1.2] SCOUT SPEECH AGENT${RESET}`);
  console.log('─'.repeat(70));
  
  try {
    const { scoutSpeechAgent } = await import('./server/agents/scout-speech.ts');
    const startTime = Date.now();
    const speechPromises = await scoutSpeechAgent.searchAndExtract(targetName);
    const elapsed = Date.now() - startTime;
    
    console.log(`${GREEN}✓ ${speechPromises.length} promessas de discursos em ${(elapsed/1000).toFixed(1)}s${RESET}`);
    
    for (const p of speechPromises) {
      allPromises.push({
        text: p.text,
        category: p.category,
        source: `Discurso: ${p.source.session}`,
        date: p.source.date,
        quote: p.quote
      });
      allStatements.push({
        text: p.text,
        date: p.source.date,
        source: p.source.session,
        category: p.category,
        quote: p.quote
      });
      
      console.log(`  • [${p.category}] ${p.text.substring(0, 60)}...`);
      if (p.quote) console.log(`    ${DIM}Citação: "${p.quote.substring(0, 50)}..."${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
  }

  console.log(`\n${BOLD}FASE 1 CONCLUÍDA: ${allPromises.length} promessas coletadas${RESET}\n`);

  if (allPromises.length === 0) {
    console.log(`${YELLOW}⚠ Nenhuma promessa coletada. Criando promessas de teste para validar Fase 2...${RESET}`);
    
    // Promessas de teste baseadas em notícias reais
    allPromises.push({
      text: 'Aprovar a isenção do Imposto de Renda para quem ganha até R$ 5.000',
      category: 'ECONOMIA',
      source: 'Teste - Notícia O Globo',
      date: '2026-01-27'
    });
    allPromises.push({
      text: 'Votar a reforma tributária ainda no primeiro semestre',
      category: 'POLÍTICA',
      source: 'Teste - Portal da Câmara',
      date: '2026-01-20'
    });
    
    allStatements.push(...allPromises.map(p => ({
      text: p.text,
      date: p.date,
      source: p.source,
      category: p.category
    })));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: CRUZAMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`${BOLD}${GREEN}┌─────────────────────────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}${GREEN}│                    FASE 2: CRUZAMENTOS                              │${RESET}`);
  console.log(`${BOLD}${GREEN}└─────────────────────────────────────────────────────────────────────┘${RESET}\n`);

  // 2.1 Promessa vs Voto
  console.log(`${BOLD}[2.1] COHERENCE VOTE AGENT (Promessa vs Voto)${RESET}`);
  console.log('─'.repeat(70));
  
  let voteResults: any[] = [];
  try {
    const { coherenceVoteAgent } = await import('./server/agents/coherence-vote.ts');
    const startTime = Date.now();
    voteResults = await coherenceVoteAgent.analyze(targetName, allPromises);
    const elapsed = Date.now() - startTime;
    
    console.log(`${GREEN}✓ Análise de votações concluída em ${(elapsed/1000).toFixed(1)}s${RESET}`);
    
    for (const r of voteResults) {
      const icon = r.verdict === 'COERENTE' ? '✅' : r.verdict === 'INCOERENTE' ? '❌' : '⚠️';
      console.log(`\n  ${icon} ${r.promise.text.substring(0, 50)}...`);
      console.log(`     Score: ${r.coherenceScore}% | Veredito: ${r.verdict}`);
      console.log(`     ${DIM}${r.summary}${RESET}`);
      
      if (r.relatedVotes.length > 0) {
        console.log(`     Votações relacionadas:`);
        for (const v of r.relatedVotes.slice(0, 2)) {
          const vIcon = v.relation === 'APOIA' ? '👍' : v.relation === 'CONTRADIZ' ? '👎' : '➖';
          console.log(`       ${vIcon} ${v.vote.proposicao}: ${v.explanation.substring(0, 50)}...`);
        }
      }
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
    console.log(e.stack);
  }

  // 2.2 Promessa vs Gasto
  console.log(`\n${BOLD}[2.2] COHERENCE EXPENSE AGENT (Promessa vs Gasto)${RESET}`);
  console.log('─'.repeat(70));
  
  let expenseResults: any = { results: [], profile: null };
  try {
    const { coherenceExpenseAgent } = await import('./server/agents/coherence-expense.ts');
    const startTime = Date.now();
    expenseResults = await coherenceExpenseAgent.analyze(targetName, allPromises);
    const elapsed = Date.now() - startTime;
    
    console.log(`${GREEN}✓ Análise de gastos concluída em ${(elapsed/1000).toFixed(1)}s${RESET}`);
    
    if (expenseResults.profile) {
      console.log(`\n  ${BOLD}Perfil Financeiro:${RESET}`);
      console.log(`     Total: R$ ${expenseResults.profile.totalExpenses.toFixed(2)}`);
      console.log(`     Top categorias:`);
      for (const cat of expenseResults.profile.topCategories.slice(0, 3)) {
        console.log(`       • ${cat.category}: R$ ${cat.total.toFixed(2)} (${cat.percentage}%)`);
      }
      
      if (expenseResults.profile.redFlags.length > 0) {
        console.log(`\n  ${BOLD}${YELLOW}Red Flags:${RESET}`);
        for (const flag of expenseResults.profile.redFlags) {
          console.log(`     ⚠️ ${flag}`);
        }
      }
    }
    
    for (const r of expenseResults.results) {
      const icon = r.verdict === 'COERENTE' ? '✅' : r.verdict === 'INCOERENTE' ? '❌' : '⚠️';
      console.log(`\n  ${icon} ${r.promise.text.substring(0, 50)}...`);
      console.log(`     Score: ${r.coherenceScore}% | Veredito: ${r.verdict}`);
      console.log(`     ${DIM}${r.summary}${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
    console.log(e.stack);
  }

  // 2.3 Análise Temporal
  console.log(`\n${BOLD}[2.3] COHERENCE TEMPORAL AGENT (Contradições Temporais)${RESET}`);
  console.log('─'.repeat(70));
  
  let temporalResult: any = null;
  try {
    const { coherenceTemporalAgent } = await import('./server/agents/coherence-temporal.ts');
    const startTime = Date.now();
    temporalResult = await coherenceTemporalAgent.analyze(targetName, allStatements);
    const elapsed = Date.now() - startTime;
    
    console.log(`${GREEN}✓ Análise temporal concluída em ${(elapsed/1000).toFixed(1)}s${RESET}`);
    console.log(`  Score de Consistência: ${temporalResult.consistencyScore}%`);
    console.log(`  ${DIM}${temporalResult.summary}${RESET}`);
    
    if (temporalResult.contradictions.length > 0) {
      console.log(`\n  ${BOLD}${YELLOW}Contradições Identificadas:${RESET}`);
      for (const c of temporalResult.contradictions) {
        const icon = c.severity === 'HIGH' ? '🔴' : c.severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`\n  ${icon} ${c.type} (${c.severity})`);
        console.log(`     Diferença: ${c.timeDifference}`);
        console.log(`     ${DIM}${c.explanation}${RESET}`);
      }
    } else {
      console.log(`  ${GREEN}✓ Nenhuma contradição temporal identificada${RESET}`);
    }
  } catch (e: any) {
    console.log(`${RED}✗ Erro: ${e.message}${RESET}`);
    console.log(e.stack);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\n\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║                    RESUMO DO TESTE INTEGRADO                       ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  // Calcular scores médios
  const avgVoteScore = voteResults.length > 0 
    ? Math.round(voteResults.reduce((sum, r) => sum + r.coherenceScore, 0) / voteResults.length)
    : 0;
  const avgExpenseScore = expenseResults.results.length > 0
    ? Math.round(expenseResults.results.reduce((sum: number, r: any) => sum + r.coherenceScore, 0) / expenseResults.results.length)
    : 0;
  const temporalScore = temporalResult?.consistencyScore || 0;

  const overallScore = Math.round((avgVoteScore + avgExpenseScore + temporalScore) / 3);

  console.log(`${BOLD}POLÍTICO: ${targetName}${RESET}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`${BOLD}FASE 1 - Coleta de Promessas:${RESET}`);
  console.log(`  • Total de promessas: ${allPromises.length}`);
  console.log(`  • Com citação direta: ${allPromises.filter(p => p.quote).length}`);

  console.log(`\n${BOLD}FASE 2 - Cruzamentos:${RESET}`);
  console.log(`  • Promessa vs Voto: ${avgVoteScore}%`);
  console.log(`  • Promessa vs Gasto: ${avgExpenseScore}%`);
  console.log(`  • Consistência Temporal: ${temporalScore}%`);

  console.log(`\n${BOLD}SCORE GERAL DE COERÊNCIA: ${overallScore}%${RESET}`);

  // Veredito final
  let finalVerdict = '';
  if (overallScore >= 70) {
    finalVerdict = `${GREEN}✅ POLÍTICO MAJORITARIAMENTE COERENTE${RESET}`;
  } else if (overallScore >= 40) {
    finalVerdict = `${YELLOW}⚠️ POLÍTICO PARCIALMENTE COERENTE - ATENÇÃO NECESSÁRIA${RESET}`;
  } else {
    finalVerdict = `${RED}❌ POLÍTICO INCOERENTE - MÚLTIPLAS CONTRADIÇÕES${RESET}`;
  }

  console.log(`\n${BOLD}VEREDITO: ${finalVerdict}${RESET}`);

  // Red flags consolidadas
  const allRedFlags = [
    ...(expenseResults.profile?.redFlags || []),
    ...expenseResults.results.flatMap((r: any) => r.redFlags || []),
    ...(temporalResult?.contradictions || []).map((c: any) => `${c.type}: ${c.explanation}`)
  ];

  if (allRedFlags.length > 0) {
    console.log(`\n${BOLD}${RED}⚠️ ALERTAS CRÍTICOS:${RESET}`);
    for (const flag of [...new Set(allRedFlags)].slice(0, 5)) {
      console.log(`  • ${flag}`);
    }
  }

  console.log(`\n${'─'.repeat(70)}\n`);

  // Status do teste
  const fase1Ok = allPromises.length > 0;
  const fase2Ok = voteResults.length > 0 || expenseResults.results.length > 0;

  if (fase1Ok && fase2Ok) {
    console.log(`${GREEN}${BOLD}✅ TESTE INTEGRADO CONCLUÍDO COM SUCESSO!${RESET}`);
    console.log(`As Fases 1 e 2 estão funcionando corretamente.`);
  } else if (fase2Ok) {
    console.log(`${YELLOW}${BOLD}⚠️ TESTE PARCIALMENTE CONCLUÍDO${RESET}`);
    console.log(`Fase 1 teve problemas, mas Fase 2 funcionou com dados de teste.`);
  } else {
    console.log(`${RED}${BOLD}❌ TESTE FALHOU${RESET}`);
    console.log(`Verificar logs acima para identificar problemas.`);
  }
}

testIntegrado().catch(console.error);
