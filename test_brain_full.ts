/**
 * TESTE COMPLETO DO BRAIN V4 INTEGRATED
 * 
 * Este teste executa o fluxo REAL do Seth VII com:
 * - Target Discovery (identificação do político)
 * - Scout Hybrid (coleta de notícias)
 * - Scout Case Miner (casos jurídicos)
 * - Deep Social Miner (redes sociais/blogs)
 * - Filter (triagem de fontes)
 * - Absence Agent (faltas em votações)
 * - Vulnerability Auditor (vulnerabilidades)
 * - Finance Service (emendas/PIX)
 * - Benchmarking Agent (comparação)
 * - Coherence Service (contradições)
 * - Consensus Validator (validação cruzada)
 * - Humanizer Engine (relatório final)
 * 
 * Integrações: SICONFI, Câmara, TSE, Portal Transparência, JusBrasil
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { logInfo, logError } from './server/core/logger.ts';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

async function testBrainFull() {
  console.log(`\n${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║     TESTE COMPLETO - BRAIN V4 INTEGRATED - SETH VII                ║${RESET}`);
  console.log(`${BOLD}${CYAN}║     Alvo: Arthur Lira (Deputado Federal - PP/AL)                   ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  const targetName = 'Arthur Lira';
  const startTime = Date.now();

  try {
    // Importar o Brain V4 Integrated
    const { brainAgentV4Integrated } = await import('./server/agents/brain-v4-integrated.ts');
    
    console.log(`${BOLD}[INICIANDO ANÁLISE PROFUNDA]${RESET}`);
    console.log(`Alvo: ${targetName}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('─'.repeat(70));
    
    // Executar análise completa
    const report = await brainAgentV4Integrated.analyze(targetName);
    
    const totalTime = Date.now() - startTime;
    
    // ═══════════════════════════════════════════════════════════════
    // EXIBIR RESULTADOS COMPLETOS
    // ═══════════════════════════════════════════════════════════════
    
    console.log(`\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${GREEN}║                    RELATÓRIO FINAL - SETH VII v4.1                 ║${RESET}`);
    console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════════════╝${RESET}\n`);

    // PERFIL
    console.log(`${BOLD}${CYAN}[PERFIL DO ALVO]${RESET}`);
    console.log('─'.repeat(70));
    console.log(`Nome: ${report.targetName}`);
    console.log(`Cargo: ${report.profile?.office || 'N/A'}`);
    console.log(`Partido: ${report.profile?.party || 'N/A'}`);
    console.log(`Estado: ${report.profile?.state || 'N/A'}`);
    
    // MÉTRICAS PRINCIPAIS
    console.log(`\n${BOLD}${CYAN}[MÉTRICAS PRINCIPAIS]${RESET}`);
    console.log('─'.repeat(70));
    console.log(`🎯 Credibilidade: ${report.credibilityScore}%`);
    console.log(`🔄 Consenso entre Modelos: ${report.consensusScore}%`);
    console.log(`⏱️ Tempo de Processamento: ${(report.processingTimeMs / 1000).toFixed(2)}s`);
    
    // LINHAGEM DE DADOS
    console.log(`\n${BOLD}${CYAN}[LINHAGEM DE DADOS - FONTES CONSULTADAS]${RESET}`);
    console.log('─'.repeat(70));
    report.dataLineage.forEach((line: string, i: number) => {
      console.log(`  ${i+1}. ${line}`);
    });
    
    // RELATÓRIOS ESPECIALIZADOS
    console.log(`\n${BOLD}${CYAN}[RELATÓRIOS DOS AGENTES ESPECIALIZADOS]${RESET}`);
    console.log('─'.repeat(70));
    
    const sr = report.specialistReports;
    
    // Ausências
    console.log(`\n${BOLD}📋 AUDITORIA DE AUSÊNCIAS (Câmara dos Deputados)${RESET}`);
    if (sr.absence?.absences?.length > 0) {
      console.log(`  Total de faltas: ${sr.absence.absences.length}`);
      sr.absence.absences.slice(0, 3).forEach((a: any, i: number) => {
        console.log(`  ${i+1}. ${a.date || a.data}: ${a.session || a.sessao || 'Sessão não especificada'}`);
      });
    } else {
      console.log(`  Nenhuma falta registrada ou dados indisponíveis`);
    }
    
    // Vulnerabilidades
    console.log(`\n${BOLD}⚠️ VULNERABILIDADES IDENTIFICADAS${RESET}`);
    if (sr.vulnerability?.evidences?.length > 0) {
      console.log(`  Total de vetores: ${sr.vulnerability.evidences.length}`);
      sr.vulnerability.evidences.slice(0, 3).forEach((v: any, i: number) => {
        console.log(`  ${i+1}. [${v.category || 'GERAL'}] ${v.statement?.substring(0, 100) || v.description?.substring(0, 100)}...`);
        if (v.sourceUrl) console.log(`     Fonte: ${v.sourceUrl}`);
      });
    } else {
      console.log(`  Nenhuma vulnerabilidade crítica identificada`);
    }
    
    // Financeiro (Emendas/PIX)
    console.log(`\n${BOLD}💰 RASTREABILIDADE FINANCEIRA (Emendas/PIX)${RESET}`);
    if (sr.finance?.length > 0) {
      console.log(`  Total de registros: ${sr.finance.length}`);
      sr.finance.slice(0, 3).forEach((f: any, i: number) => {
        console.log(`  ${i+1}. ${f.description || f.descricao}`);
        console.log(`     Valor: ${f.value || f.valor || 'N/A'}`);
        console.log(`     Fonte: ${f.source || f.fonte || 'Portal Transparência'}`);
      });
    } else {
      console.log(`  Nenhum registro de emenda/PIX encontrado`);
    }
    
    // Coerência/Contradições
    console.log(`\n${BOLD}🔍 ANÁLISE DE COERÊNCIA (Contradições)${RESET}`);
    if (sr.coherence?.contradictions?.length > 0) {
      console.log(`  Total de contradições: ${sr.coherence.contradictions.length}`);
      sr.coherence.contradictions.slice(0, 3).forEach((c: any, i: number) => {
        console.log(`  ${i+1}. ${c.topic || c.tema}:`);
        console.log(`     Discurso: ${c.discourse?.text?.substring(0, 80) || 'N/A'}...`);
        console.log(`     Realidade: ${c.reality?.text?.substring(0, 80) || 'N/A'}...`);
      });
    } else {
      console.log(`  Nenhuma contradição significativa identificada`);
    }
    
    // Social/Blogs
    console.log(`\n${BOLD}📱 MINERAÇÃO SOCIAL (Redes/Blogs)${RESET}`);
    if (sr.social?.length > 0) {
      console.log(`  Total de fontes sociais: ${sr.social.length}`);
      sr.social.slice(0, 3).forEach((s: any, i: number) => {
        console.log(`  ${i+1}. [${s.platform || 'Web'}] ${s.content?.substring(0, 100) || s.title?.substring(0, 100)}...`);
      });
    } else {
      console.log(`  Nenhuma fonte social relevante encontrada`);
    }
    
    // Benchmarking
    console.log(`\n${BOLD}📊 BENCHMARKING POLÍTICO${RESET}`);
    if (sr.benchmarking) {
      console.log(`  ${JSON.stringify(sr.benchmarking, null, 2).substring(0, 500)}...`);
    } else {
      console.log(`  Dados de benchmarking indisponíveis`);
    }
    
    // VEREDITO FINAL
    console.log(`\n${BOLD}${CYAN}[VEREDITO TÉCNICO]${RESET}`);
    console.log('─'.repeat(70));
    if (report.verdict) {
      console.log(JSON.stringify(report.verdict, null, 2));
    } else {
      console.log('Veredito não disponível');
    }
    
    // RELATÓRIO HUMANIZADO
    console.log(`\n${BOLD}${CYAN}[RELATÓRIO HUMANIZADO PARA O CIDADÃO]${RESET}`);
    console.log('─'.repeat(70));
    if (report.humanizedReport) {
      console.log(report.humanizedReport);
    } else {
      console.log('Relatório humanizado não disponível');
    }
    
    // RESUMO FINAL
    console.log(`\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${GREEN}║                         ANÁLISE CONCLUÍDA                          ║${RESET}`);
    console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════════════╝${RESET}`);
    console.log(`\nTempo total: ${(totalTime / 1000).toFixed(2)} segundos`);
    console.log(`Gerado em: ${report.generatedAt}`);
    
  } catch (error: any) {
    console.log(`\n${RED}${BOLD}╔════════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${RED}${BOLD}║                         ERRO NA ANÁLISE                            ║${RESET}`);
    console.log(`${RED}${BOLD}╚════════════════════════════════════════════════════════════════════╝${RESET}`);
    console.log(`\nErro: ${error.message}`);
    console.log(`\nStack: ${error.stack}`);
    
    logError('Erro no teste completo:', error);
    process.exit(1);
  }
}

testBrainFull().catch(console.error);
