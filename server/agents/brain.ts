/**
 * Brain Agent v6.0 - SETH VII COMPLETO
 * 
 * Orquestrador principal com TODOS os componentes integrados:
 * - Fase 1: Coleta Multidimensional (Promessas, Social, Jurídico, Diários)
 * - Fase 2: Cruzamentos Profundos (Voto, Gasto, Temporal, Patrimônio)
 * - Fase 3: Validação Cruzada (Consensus Validator)
 * - Fase 4: Humanização do Relatório
 */

import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { scoutCaseMiner } from './scout-case-miner.ts';
// Agentes REINTEGRADOS da v3.2
import { MultiScoutAgent } from './multi-scout.ts';
import { ScoutRegional } from './scout-regional.ts';
import { filterAgent, FilteredSource } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { getProposicoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability } from '../integrations/siconfi.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { financeService } from '../services/finance.service.ts';
import { proxyBenchmarkingAgent } from './proxy-benchmarking.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';
import { dataCorrelator } from './correlator.ts';
import { governmentPlanExtractorService } from '../services/government-plan-extractor.service.ts';
import { scoutInterviewAgent } from './scout-interview.ts';
import { scoutSpeechAgent } from './scout-speech.ts';
// Agentes de coerência (Fase 2)
import { coherenceVoteAgent, VoteCoherenceResult } from './coherence-vote.ts';
import { coherenceExpenseAgent, ExpenseCoherenceResult, ExpenseProfile } from './coherence-expense.ts';
import { coherenceTemporalAgent, TemporalAnalysisResult } from './coherence-temporal.ts';
// Componentes REINTEGRADOS
import { deepSocialMiner, SocialEvidence } from './deep-social-miner.ts';
import { jusBrasilAlternative, LegalRecord } from '../integrations/jusbrasil-alternative.ts';
import { getPoliticalHistory, validateCandidateCredibility } from '../integrations/tse.ts';
import { consensusValidatorService, ValidationResult } from '../services/consensus-validator.service.ts';
import { humanizerEngine } from '../services/humanizer-engine.ts';

export interface CoherenceAnalysis {
  voteAnalysis: VoteCoherenceResult[];
  expenseAnalysis: { results: ExpenseCoherenceResult[]; profile: ExpenseProfile };
  temporalAnalysis: TemporalAnalysisResult;
  overallScore: number;
  verdict: string;
  redFlags: string[];
}

export interface FullAnalysisResult {
  politicianName: string;
  politician: { office: string; party: string; state: string };
  // Fase 1: Coleta
  promises: {
    total: number;
    government: number;
    interviews: number;
    speeches: number;
    items: any[];
  };
  socialEvidences: SocialEvidence[];
  legalRecords: LegalRecord[];
  tseHistory: any;
  // Fase 2: Análises
  absenceReport: any;
  vulnerabilityReport: any;
  benchmarkResult: any;
  coherenceAnalysis: CoherenceAnalysis;
  evidences: any[];
  // Fase 3: Validação
  consensusValidation: ValidationResult | null;
  // Fase 4: Humanização
  humanizedReport: string;
  technicalReport: string;
  // Metadados
  dataLineage: Record<string, string>;
  consensusMetrics: {
    sourceCount: number;
    verifiedCount: number;
    coherenceScore: number;
    consensusScore: number;
  };
}

export class BrainAgent {
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null): Promise<FullAnalysisResult> {
    const cleanName = politicianName.trim();
    const startTime = Date.now();
    logInfo(`[Brain v6] 🧠 Iniciando análise COMPLETA para: ${cleanName}`);

    try {
      const supabase = getSupabase();
      const updateProgress = async (progress: number, statusText?: string) => {
        if (existingId) {
          logInfo(`[Brain v6] [Progress ${progress}%] ${statusText || 'Processando...'}`);
          await supabase.from('analyses').update({ 
            progress, 
            text: statusText || undefined,
            updated_at: new Date().toISOString() 
          }).eq('id', existingId);
        }
      };

      // ═══════════════════════════════════════════════════════════════════════
      // ETAPA 0: Descoberta de Identidade
      // ═══════════════════════════════════════════════════════════════════════
      await updateProgress(5, `Identificando perfil oficial de ${cleanName}...`);
      const profile = await targetDiscoveryService.discover(cleanName);
      logInfo(`[Brain v6] Alvo: ${profile.office} ${profile.name} (${profile.party})`);

      const regionContext = { 
        state: profile.state !== 'Brasil' ? profile.state : this.detectRegion(cleanName).state,
        city: profile.city || this.detectRegion(cleanName).city
      };

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: COLETA MULTIDIMENSIONAL (EXPANDIDA)
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v6] === FASE 1: COLETA MULTIDIMENSIONAL ===`);
      await updateProgress(15, `Minerando portais oficiais, diários e redes sociais...`);
      
      const searchQuery = `${profile.office} ${profile.name} ${profile.party} ${regionContext.state}`;
      
      // Coleta paralela de TODAS as fontes
      const [
        rawSources, 
        caseEvidences, 
        governmentPromises, 
        interviewPromises, 
        speechPromises,
        socialEvidences,      // REINTEGRADO
        legalRecords,         // REINTEGRADO
        diarioRecords,        // REINTEGRADO
        tseHistory            // REINTEGRADO
      ] = await Promise.all([
        scoutHybrid.search(searchQuery, true),
        scoutCaseMiner.mine(profile.name),
        governmentPlanExtractorService.extractFromTSE(profile.name, profile.state, 2022).catch(() => []),
        scoutInterviewAgent.searchAndExtract(profile.name).catch(() => []),
        scoutSpeechAgent.searchAndExtract(profile.name).catch(() => []),
        // NOVOS - Reintegrados
        deepSocialMiner.mine(profile.name).catch(() => []),
        jusBrasilAlternative.searchLegalRecords(profile.name).catch(() => []),
        jusBrasilAlternative.searchQueridoDiario(profile.name).catch(() => []),
        getPoliticalHistory(profile.name, regionContext.state).catch(() => null)
      ]);
      
      logInfo(`[Brain v6] Fontes coletadas:`);
      logInfo(`[Brain v6] - Notícias: ${rawSources.length} | Casos: ${caseEvidences.length}`);
      logInfo(`[Brain v6] - Promessas: Governo(${governmentPromises.length}) | Entrevistas(${interviewPromises.length}) | Discursos(${speechPromises.length})`);
      logInfo(`[Brain v6] - Social: ${socialEvidences.length} | Jurídico: ${legalRecords.length} | Diários: ${diarioRecords.length}`);
      logInfo(`[Brain v6] - TSE: ${tseHistory ? 'Encontrado' : 'Não encontrado'}`);
      
      // Consolidar todas as promessas
      const allPromises = [
        ...governmentPromises.map((p: any) => ({
          text: p.text || p.promise,
          category: p.category || 'GERAL',
          source: 'Plano de Governo (TSE)',
          date: p.date,
          quote: p.quote
        })),
        ...interviewPromises.map((p: any) => ({
          text: p.text,
          category: p.category || 'GERAL',
          source: `Entrevista: ${p.source?.platform || 'N/A'}`,
          date: p.source?.date,
          quote: p.quote
        })),
        ...speechPromises.map((p: any) => ({
          text: p.text,
          category: p.category || 'GERAL',
          source: `Discurso: ${p.source?.session || 'N/A'}`,
          date: p.source?.date,
          quote: p.quote
        }))
      ];

      // Combinar registros jurídicos
      const allLegalRecords = [...legalRecords, ...diarioRecords];

      logInfo(`[Brain v6] Total de promessas consolidadas: ${allPromises.length}`);

      const filteredSources = await filterAgent.filter(rawSources, true);
      logInfo(`[Brain v6] Fontes filtradas: ${filteredSources.length}`);
      
      const dataSources = { 
        politicianName: profile.name, 
        politician: { office: profile.office, party: profile.party, state: profile.state } 
      };
      
      const supabaseCanonical = getSupabase();
      let { data: canonical } = await supabaseCanonical.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: CRUZAMENTOS E ANÁLISE DE COERÊNCIA
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v6] === FASE 2: CRUZAMENTOS E ANÁLISE DE COERÊNCIA ===`);
      await updateProgress(40, `Cruzando promessas com votações e gastos reais...`);
      
      const isLegislative = profile.office.toLowerCase().includes('deputado') || profile.office.toLowerCase().includes('senador');

      // Executar análises em paralelo
      const [
        absenceReport, 
        vulnerabilityReport, 
        financeEvidences, 
        benchmarkResult,
        voteAnalysis,
        expenseAnalysis,
        temporalAnalysis,
        tseCredibility       // REINTEGRADO
      ] = await Promise.all([
        isLegislative ? this.runAbsenceCheck(cleanName, filteredSources, regionContext) : Promise.resolve(null),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources),
        // Agentes de coerência
        allPromises.length > 0 ? coherenceVoteAgent.analyze(profile.name, allPromises) : Promise.resolve([]),
        allPromises.length > 0 ? coherenceExpenseAgent.analyze(profile.name, allPromises) : Promise.resolve({ results: [], profile: { totalExpenses: 0, byCategory: {}, topCategories: [], topSuppliers: [], redFlags: [], suspiciousPatterns: [] } }),
        this.prepareTemporalAnalysis(profile.name, allPromises),
        // NOVO - Credibilidade TSE
        validateCandidateCredibility(profile.name, regionContext.state).catch(() => null)
      ]);

      logInfo(`[Brain v6] Análise de coerência concluída`);
      await updateProgress(60, `Consolidando dados de coerência e integridade...`);
      logInfo(`[Brain v6] - Votações analisadas: ${voteAnalysis.length}`);
      logInfo(`[Brain v6] - Gastos analisados: ${expenseAnalysis.results.length}`);
      logInfo(`[Brain v6] - Contradições temporais: ${temporalAnalysis.contradictions.length}`);
      logInfo(`[Brain v6] - Credibilidade TSE: ${tseCredibility?.score ? Math.round(tseCredibility.score * 100) + '%' : 'N/A'}`);

      // Calcular score geral de coerência
      const coherenceAnalysis = this.calculateCoherenceScore(voteAnalysis, expenseAnalysis, temporalAnalysis);

      let evidences = [...(vulnerabilityReport?.evidences || []), ...financeEvidences];
      
      // Correlação de dados
      const correlations = await dataCorrelator.correlate({
        absence: absenceReport,
        vulnerability: vulnerabilityReport,
        financial: financeEvidences,
        sources: filteredSources
      });

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 3: VALIDAÇÃO CRUZADA (CONSENSUS VALIDATOR) - REINTEGRADO
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v6] === FASE 3: VALIDAÇÃO CRUZADA ===`);
      await updateProgress(70, `Validando veredito com rede de consenso de IAs...`);

      const combinedContext = this.buildCombinedContext(
        dataSources, absenceReport, vulnerabilityReport, benchmarkResult, 
        financeEvidences, correlations, allPromises, governmentPromises,
        interviewPromises, speechPromises, coherenceAnalysis, filteredSources,
        socialEvidences, allLegalRecords, tseHistory, tseCredibility
      );

      // Gerar prompt técnico para validação
      const technicalPrompt = this.buildForensicPrompt(cleanName, combinedContext);
      
      // ═══════════════════════════════════════════════════════════════════════
      // DOUBLE-PASS AI VEREDICT (RESTAURADO)
      // Passagem 1: Gera parecer técnico completo
      // Passagem 2: Extrai promessas estruturadas do parecer
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v6] [Double-Pass] Iniciando VerdictEngine para ${cleanName}...`);
      
      const { 
        finalReport: doublePassReport, 
        finalPromises: extractedPromisesFromAI,
        structuredVerdict 
      } = await this.generateDoublePassAIVeredict(cleanName, combinedContext, filteredSources, rawSources, regionContext);
      
      // Adicionar promessas extraídas do parecer às promessas existentes
      if (extractedPromisesFromAI.length > 0) {
        logInfo(`[Brain v6] [Double-Pass] Extraídas ${extractedPromisesFromAI.length} promessas do parecer`);
        allPromises.push(...extractedPromisesFromAI.map((p: any) => ({
          text: p.text || p.promise,
          category: p.category || 'EXTRAIDO_PARECER',
          source: 'Parecer Técnico Seth VII',
          confidence: p.confidence || 70,
          status: p.status || 'pendente',
          date: new Date().toISOString().split('T')[0]
        })));
      }
      
      // Validação cruzada com múltiplas IAs
      let consensusValidation: ValidationResult | null = null;
      try {
        consensusValidation = await consensusValidatorService.validateWithCrossModel(technicalPrompt);
        logInfo(`[Brain v6] Consenso entre modelos: ${consensusValidation.consensusScore}%`);
      } catch (e) {
        logWarn(`[Brain v6] Validação cruzada falhou, usando análise única`);
      }

      // Usar o parecer do Double-Pass como base, enriquecido pelo Consensus Validator
      const technicalReport = consensusValidation?.finalVerdict?.reasoning || 
                             doublePassReport || 
                             await aiService.generateReport(technicalPrompt);

      await updateProgress(85, `Gerando relatório técnico final...`);

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 4: HUMANIZAÇÃO DO RELATÓRIO - REINTEGRADO
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v6] === FASE 4: HUMANIZAÇÃO DO RELATÓRIO ===`);
      await updateProgress(95, `Finalizando dossiê humanizado e auditável...`);

      let humanizedReport = '';
      try {
        humanizedReport = await humanizerEngine.humanize({
          targetName: cleanName,
          verdict: consensusValidation?.finalVerdict || {
            reasoning: technicalReport,
            mainFindings: coherenceAnalysis.redFlags.slice(0, 5),
            contradictions: temporalAnalysis.contradictions.map(c => c.explanation)
          },
          specialistReports: {
            absence: absenceReport,
            vulnerability: vulnerabilityReport,
            finance: financeEvidences,
            benchmarking: benchmarkResult,
            coherence: coherenceAnalysis
          },
          socialEvidences,
          sources: filteredSources
        });
        logInfo(`[Brain v6] Relatório humanizado gerado com sucesso`);
      } catch (e) {
        logWarn(`[Brain v6] Humanização falhou, usando relatório técnico`);
        humanizedReport = technicalReport;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // RESULTADO FINAL
      // ═══════════════════════════════════════════════════════════════════════
      const processingTime = Date.now() - startTime;
      logInfo(`[Brain v6] Análise completa em ${processingTime}ms`);

      const finalResult: FullAnalysisResult = {
        politicianName: profile.name,
        politician: { office: profile.office, party: profile.party, state: profile.state },
        // Fase 1
        promises: {
          total: allPromises.length,
          government: governmentPromises.length,
          interviews: interviewPromises.length,
          speeches: speechPromises.length,
          items: allPromises // SEM LIMITE - todas as promessas
        },
        socialEvidences,
        legalRecords: allLegalRecords,
        tseHistory,
        // Fase 2
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        coherenceAnalysis,
        evidences,
        // Fase 3
        consensusValidation,
        // Fase 4
        humanizedReport,
        technicalReport,
        // Metadados
        dataLineage: {
          vulnerability: 'Minerado via EvidenceMiner (Forense)',
          benchmarking: 'Baseado em dados do Supabase e APIs Oficiais',
          regional: `Portal Transparência ${regionContext.state}`,
          legislative: 'API Câmara/Senado',
          cases: 'Navegação profunda via Scout Case Miner v3.2',
          coherence: 'Análise de Coerência v2.0 (Vote, Expense, Temporal)',
          social: 'Deep Social Miner (Twitter, Facebook, Blogs)',
          legal: 'JusBrasil Alternative + Querido Diário',
          tse: 'Tribunal Superior Eleitoral (Histórico)',
          consensus: 'Consensus Validator (Cross-Model)',
          humanization: 'Humanizer Engine v1.0'
        },
        consensusMetrics: {
          sourceCount: rawSources.length,
          verifiedCount: filteredSources.length,
          coherenceScore: coherenceAnalysis.overallScore,
          consensusScore: consensusValidation?.consensusScore || 0
        }
      };

      await this.persistAnalysis(userId, humanizedReport, cleanName, dataSources, finalResult, filteredSources, existingId);
      return finalResult;
    } catch (error) {
      logError(`[Brain v6] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  /**
   * Constrói contexto combinado para análise
   */
  private buildCombinedContext(
    dataSources: any, absenceReport: any, vulnerabilityReport: any, benchmarkResult: any,
    financeEvidences: any[], correlations: any, allPromises: any[], governmentPromises: any[],
    interviewPromises: any[], speechPromises: any[], coherenceAnalysis: CoherenceAnalysis,
    filteredSources: any[], socialEvidences: SocialEvidence[], legalRecords: LegalRecord[],
    tseHistory: any, tseCredibility: any
  ) {
    return {
      officialProfile: dataSources,
      absence: absenceReport,
      vulnerability: vulnerabilityReport,
      benchmarking: benchmarkResult,
      financial: financeEvidences,
      correlations: correlations,
      promises: {
        government: governmentPromises,
        interviews: interviewPromises,
        speeches: speechPromises,
        all: allPromises
      },
      coherenceAnalysis: {
        voteAnalysis: coherenceAnalysis.voteAnalysis.map(v => ({
          promise: v.promise.text,
          score: v.coherenceScore,
          verdict: v.verdict,
          summary: v.summary,
          deepAnalysis: v.deepAnalysis,
          relatedVotes: v.relatedVotes.map(rv => ({
            proposicao: rv.vote.proposicao,
            voto: rv.vote.voto,
            relation: rv.relation,
            explanation: rv.explanation
          }))
        })),
        expenseAnalysis: {
          profile: coherenceAnalysis.expenseAnalysis.profile,
          results: coherenceAnalysis.expenseAnalysis.results.map(e => ({
            promise: e.promise.text,
            score: e.coherenceScore,
            verdict: e.verdict,
            summary: e.summary,
            redFlags: e.redFlags,
            deepAnalysis: e.deepAnalysis
          }))
        },
        temporalAnalysis: {
          score: coherenceAnalysis.temporalAnalysis.consistencyScore,
          summary: coherenceAnalysis.temporalAnalysis.summary,
          contradictions: coherenceAnalysis.temporalAnalysis.contradictions.map(c => ({
            type: c.type,
            severity: c.severity,
            explanation: c.explanation,
            timeDifference: c.timeDifference
          }))
        },
        overallScore: coherenceAnalysis.overallScore,
        verdict: coherenceAnalysis.verdict,
        redFlags: coherenceAnalysis.redFlags
      },
      // NOVOS - Reintegrados
      social: socialEvidences.slice(0, 50).map(s => ({ // AUMENTADO de 10 para 50
        platform: s.platform,
        content: s.content.substring(0, 800), // AUMENTADO de 500 para 800
        url: s.url,
        relevance: s.relevance
      })),
      legal: legalRecords.slice(0, 30).map(l => ({ // AUMENTADO de 10 para 30
        title: l.title,
        source: l.source,
        excerpt: l.excerpt,
        url: l.url
      })),
      tse: {
        history: tseHistory,
        credibility: tseCredibility
      },
      sources: filteredSources.map(s => ({ title: s.title, content: s.content.substring(0, 800), url: s.url }))
    };
  }

  /**
   * Constrói prompt forense completo
   */
  private buildForensicPrompt(cleanName: string, context: any): string {
    return `
═══════════════════════════════════════════════════════════════════════════════
DOSSIÊ DE INTELIGÊNCIA FORENSE - SETH VII v6.0 (SISTEMA COMPLETO)
═══════════════════════════════════════════════════════════════════════════════

ALVO: ${cleanName}
IDENTIDADE: ${context.officialProfile.politician.office} (${context.officialProfile.politician.party})

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 1: ANÁLISE DE COERÊNCIA
═══════════════════════════════════════════════════════════════════════════════

SCORE GERAL DE COERÊNCIA: ${context.coherenceAnalysis.overallScore}%
VEREDITO: ${context.coherenceAnalysis.verdict}

PROMESSAS COLETADAS (${context.promises.all.length} total):
${context.promises.all.slice(0, 20).map((p: any, i: number) => ` // AUMENTADO de 5 para 20
${i+1}. [${p.category}] "${p.text}"
   Fonte: ${p.source}
   ${p.quote ? `Citação: "${p.quote}"` : ''}
`).join('')}

ANÁLISE PROMESSA vs VOTO:
${context.coherenceAnalysis.voteAnalysis.slice(0, 10).map((v: any) => ` // AUMENTADO de 3 para 10
- Promessa: "${v.promise.substring(0, 60)}..."
  Score: ${v.score}% | Veredito: ${v.verdict}
  ${v.summary}
  ${v.deepAnalysis?.followTheMoney ? `Follow the Money: ${v.deepAnalysis.followTheMoney}` : ''}
`).join('')}

ANÁLISE PROMESSA vs GASTO:
Perfil Financeiro:
- Total: R$ ${context.coherenceAnalysis.expenseAnalysis.profile.totalExpenses?.toFixed(2) || 'N/A'}
- Top categorias: ${context.coherenceAnalysis.expenseAnalysis.profile.topCategories?.slice(0, 3).map((c: any) => `${c.category} (${c.percentage}%)`).join(', ') || 'N/A'}
- Top fornecedores: ${context.coherenceAnalysis.expenseAnalysis.profile.topSuppliers?.slice(0, 3).map((s: any) => `${s.name} (R$ ${s.total?.toFixed(2)})`).join(', ') || 'N/A'}

${context.coherenceAnalysis.expenseAnalysis.results.slice(0, 10).map((e: any) => ` // AUMENTADO de 3 para 10
- Promessa: "${e.promise.substring(0, 60)}..."
  Score: ${e.score}% | Veredito: ${e.verdict}
  ${e.summary}
  ${e.deepAnalysis?.supplierAnalysis ? `Fornecedores: ${e.deepAnalysis.supplierAnalysis}` : ''}
`).join('')}

CONTRADIÇÕES TEMPORAIS:
Score de Consistência: ${context.coherenceAnalysis.temporalAnalysis.score}%
${context.coherenceAnalysis.temporalAnalysis.contradictions.slice(0, 10).map((c: any) => ` // AUMENTADO de 3 para 10
- ${c.type} (${c.severity}): ${c.explanation}
  Diferença temporal: ${c.timeDifference}
`).join('')}

RED FLAGS:
${context.coherenceAnalysis.redFlags.slice(0, 20).map((r: string) => `⚠️ ${r}`).join('\n')} // AUMENTADO de 5 para 20

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 2: EVIDÊNCIAS SOCIAIS (REDES SOCIAIS E BLOGS)
═══════════════════════════════════════════════════════════════════════════════

${context.social.length > 0 ? context.social.map((s: any, i: number) => `
${i+1}. [${s.platform.toUpperCase()}] Relevância: ${s.relevance}%
   ${s.content.substring(0, 200)}...
   URL: ${s.url}
`).join('') : 'Nenhuma evidência social encontrada.'}

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 3: REGISTROS JURÍDICOS E DIÁRIOS OFICIAIS
═══════════════════════════════════════════════════════════════════════════════

${context.legal.length > 0 ? context.legal.map((l: any, i: number) => `
${i+1}. [${l.source}] ${l.title}
   ${l.excerpt}
   URL: ${l.url}
`).join('') : 'Nenhum registro jurídico encontrado.'}

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 4: HISTÓRICO TSE
═══════════════════════════════════════════════════════════════════════════════

${context.tse.history ? `
- Total de Eleições: ${context.tse.history.totalElections}
- Eleito: ${context.tse.history.totalElected} vezes
- Taxa de Eleição: ${context.tse.history.electionRate}%
- Escândalos Registrados: ${context.tse.history.scandals}
` : 'Histórico TSE não disponível.'}

${context.tse.credibility ? `
Credibilidade TSE: ${Math.round(context.tse.credibility.score * 100)}%
Razão: ${context.tse.credibility.reason}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 5: DADOS COMPLEMENTARES
═══════════════════════════════════════════════════════════════════════════════

- AUDITORIA DE AUSÊNCIA: ${JSON.stringify(context.absence)}
- VULNERABILIDADES: ${JSON.stringify(context.vulnerability)}
- CORRELAÇÕES: ${JSON.stringify(context.correlations)}
- FONTES PRIMÁRIAS: ${context.sources.length} fontes verificadas

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES PARA O PARECER
═══════════════════════════════════════════════════════════════════════════════

1. ESTRUTURA OBRIGATÓRIA:
   - QUADRO EXECUTIVO: Fatos de impacto imediato
   - CONTRADIÇÕES DETECTADAS: Promessa vs Prática
   - PERFIL FINANCEIRO: Gastos vs Promessas (com fornecedores)
   - EVIDÊNCIAS SOCIAIS: O que dizem nas redes
   - REGISTROS JURÍDICOS: Processos e publicações oficiais
   - VETORES DE RISCO: Vulnerabilidades e red flags
   - VEREDITO FORENSE: Parecer final com score de coerência

2. SEJA INCISIVO: Use os dados de coerência para fundamentar cada afirmação
3. CITE VALORES: Mencione R$, percentuais, datas específicas
4. CONECTE OS PONTOS: Relacione promessas com votos, gastos e evidências sociais
5. INCLUA CITAÇÕES: Use as evidências sociais e jurídicas como prova

RESPONDA EM JSON:
{
  "credibilityScore": 0-100,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "mainFindings": ["finding1", "finding2", ...],
  "contradictions": ["contradiction1", "contradiction2", ...],
  "financialAnalysis": "análise detalhada dos gastos",
  "socialAnalysis": "análise das evidências sociais",
  "legalAnalysis": "análise dos registros jurídicos",
  "reasoning": "parecer técnico completo",
  "recommendations": ["recomendação1", "recomendação2", ...]
}`;
  }

  /**
   * Prepara dados para análise temporal
   */
  private async prepareTemporalAnalysis(politicianName: string, promises: any[]): Promise<TemporalAnalysisResult> {
    const statements = promises.map(p => ({
      text: p.text,
      date: p.date || new Date().toISOString().split('T')[0],
      source: p.source,
      category: p.category,
      quote: p.quote
    }));

    return coherenceTemporalAgent.analyze(politicianName, statements);
  }

  /**
   * Calcula score geral de coerência
   */
  private calculateCoherenceScore(
    voteAnalysis: VoteCoherenceResult[],
    expenseAnalysis: { results: ExpenseCoherenceResult[]; profile: ExpenseProfile },
    temporalAnalysis: TemporalAnalysisResult
  ): CoherenceAnalysis {
    const avgVoteScore = voteAnalysis.length > 0 
      ? Math.round(voteAnalysis.reduce((sum, r) => sum + r.coherenceScore, 0) / voteAnalysis.length)
      : 50;
    
    const avgExpenseScore = expenseAnalysis.results.length > 0
      ? Math.round(expenseAnalysis.results.reduce((sum, r) => sum + r.coherenceScore, 0) / expenseAnalysis.results.length)
      : 50;
    
    const temporalScore = temporalAnalysis.consistencyScore || 50;

    const overallScore = Math.round(
      (avgVoteScore * 0.35) + 
      (avgExpenseScore * 0.35) + 
      (temporalScore * 0.30)
    );

    const redFlags: string[] = [
      ...(expenseAnalysis.profile.redFlags || []),
      ...expenseAnalysis.results.flatMap(r => r.redFlags || []),
      ...temporalAnalysis.contradictions
        .filter(c => c.severity === 'HIGH')
        .map(c => `${c.type}: ${c.explanation}`)
    ];

    let verdict = '';
    if (overallScore >= 70) {
      verdict = 'POLÍTICO MAJORITARIAMENTE COERENTE';
    } else if (overallScore >= 40) {
      verdict = 'POLÍTICO PARCIALMENTE COERENTE - ATENÇÃO NECESSÁRIA';
    } else {
      verdict = 'POLÍTICO INCOERENTE - MÚLTIPLAS CONTRADIÇÕES DETECTADAS';
    }

    return {
      voteAnalysis,
      expenseAnalysis,
      temporalAnalysis,
      overallScore,
      verdict,
      redFlags: [...new Set(redFlags)] // SEM LIMITE - todas as red flags
    };
  }

  /**
   * DOUBLE-PASS AI VEREDICT (RESTAURADO)
   * Passagem 1: Gera parecer técnico completo com tom de agência de inteligência
   * Passagem 2: Extrai promessas estruturadas do parecer gerado
   */
  private async generateDoublePassAIVeredict(
    cleanName: string, 
    combinedContext: any, 
    filteredSources: any[], 
    rawSources: any[], 
    region: any
  ): Promise<{ finalReport: string; finalPromises: any[]; structuredVerdict: any }> {
    logInfo(`[Brain v6] [Double-Pass] Iniciando VerdictEngine para ${cleanName} em ${region.state}...`);
    
    let aiAnalysis = "";
    let extractedPromisesFromAI: any[] = [];
    let structuredVerdict: any = null;
    
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // PASSAGEM 1: PARECER TÉCNICO FORENSE (TOM DE AGÊNCIA DE INTELIGÊNCIA)
      // ═══════════════════════════════════════════════════════════════════════
      const strictPrompt = `
DOSSIÊ DE INTELIGÊNCIA FORENSE - SETH VII v6.0 (IRONCLAD DEEP)
═══════════════════════════════════════════════════════════════════════════════

ALVO: ${cleanName}
IDENTIDADE: ${combinedContext.officialProfile?.politician?.office || 'Político'} (${combinedContext.officialProfile?.politician?.party || 'Partido'})
REGIÃO: ${region.state} / ${region.city}

═══════════════════════════════════════════════════════════════════════════════
DADOS BRUTOS PARA CORRELAÇÃO
═══════════════════════════════════════════════════════════════════════════════

📋 PERFIL OFICIAL:
${JSON.stringify(combinedContext.officialProfile, null, 2)}

📊 ANÁLISE DE COERÊNCIA:
- Score Geral: ${combinedContext.coherenceAnalysis?.overallScore || 'N/A'}%
- Veredito: ${combinedContext.coherenceAnalysis?.verdict || 'N/A'}
- Red Flags: ${combinedContext.coherenceAnalysis?.redFlags?.join(', ') || 'Nenhuma'}

🗳️ PROMESSA vs VOTO:
${JSON.stringify(combinedContext.coherenceAnalysis?.voteAnalysis?.slice(0, 10) || [], null, 2)} // AUMENTADO de 3 para 10

💰 PROMESSA vs GASTO:
${JSON.stringify(combinedContext.coherenceAnalysis?.expenseAnalysis || {}, null, 2)}

⏱️ CONTRADIÇÕES TEMPORAIS:
${JSON.stringify(combinedContext.coherenceAnalysis?.temporalAnalysis || {}, null, 2)}

📱 EVIDÊNCIAS SOCIAIS:
${JSON.stringify(combinedContext.social?.slice(0, 20) || [], null, 2)} // AUMENTADO de 5 para 20

⚖️ REGISTROS JURÍDICOS:
${JSON.stringify(combinedContext.legal?.slice(0, 15) || [], null, 2)} // AUMENTADO de 5 para 15

🗃️ HISTÓRICO TSE:
${JSON.stringify(combinedContext.tse || {}, null, 2)}

📰 FONTES PRIMÁRIAS (CITE-AS):
${combinedContext.sources?.slice(0, 15).map((s: any) => `- ${s.title}: ${s.content?.substring(0, 400)}...`).join('\n') || 'Nenhuma fonte'} // AUMENTADO de 5 para 15, conteúdo de 200 para 400

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES MANDATÓRIAS
═══════════════════════════════════════════════════════════════════════════════

1. SEJA INCISIVO: Não use "pode ser", use "os dados indicam". Conecte o dinheiro (emendas) com os votos e discursos.

2. CITAÇÃO DIRETA: Você DEVE citar nomes de projetos, valores em Reais (R$) e títulos de notícias/documentos presentes nas fontes.

3. ANÁLISE DE IMPACTO: Explique O QUE a ausência ou vulnerabilidade significa para o cidadão.

4. ESTRUTURA DE ALTO NÍVEL:
   - QUADRO EXECUTIVO: Fatos de impacto imediato.
   - CORRELAÇÃO DE DADOS: Onde o dinheiro e o poder se encontram (conecte as fontes).
   - VETORES DE RISCO: Vulnerabilidades e inconsistências detectadas com evidências.
   - CONTRADIÇÕES: Liste cada contradição entre promessa e prática.
   - VEREDITO FORENSE: Parecer final baseado na densidade de dados.

5. Se os dados forem mínimos, não invente, mas explore ao máximo as conexões entre o pouco que existe.

6. NÃO use tom de biografia. Use tom de relatório de agência de inteligência.

═══════════════════════════════════════════════════════════════════════════════
PARECER TÉCNICO (RESPONDA ABAIXO):
═══════════════════════════════════════════════════════════════════════════════
`;

      aiAnalysis = await aiService.generateReport(strictPrompt);
      logInfo(`[Brain v6] [Double-Pass] Passagem 1 concluída: ${aiAnalysis.length} caracteres`);

      // ═══════════════════════════════════════════════════════════════════════
      // PASSAGEM 2: EXTRAÇÃO ESTRUTURADA DE PROMESSAS E VEREDITO
      // ═══════════════════════════════════════════════════════════════════════
      const extractionPrompt = `
Com base no parecer técnico abaixo, extraia as informações em formato JSON estruturado.

PARECER:
${aiAnalysis}

RESPONDA APENAS COM JSON VÁLIDO:
{
  "promises": [
    {
      "text": "texto da promessa identificada",
      "category": "ECONOMIA|SAUDE|EDUCACAO|SEGURANCA|INFRAESTRUTURA|SOCIAL|POLITICA|OUTRO",
      "status": "cumprida|parcialmente_cumprida|nao_cumprida|pendente|contraditoria",
      "evidence": "evidência que suporta o status",
      "confidence": 0-100
    }
  ],
  "contradictions": [
    {
      "statement1": "o que disse/prometeu",
      "statement2": "o que fez/votou",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "explanation": "explicação da contradição"
    }
  ],
  "riskFactors": [
    {
      "factor": "descrição do fator de risco",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "evidence": "evidência"
    }
  ],
  "credibilityScore": 0-100,
  "finalVerdict": "veredito final em uma frase"
}
`;

      try {
        const structuredResult = await aiService.analyzeText(extractionPrompt);
        
        if (structuredResult?.promises && Array.isArray(structuredResult.promises)) {
          extractedPromisesFromAI = structuredResult.promises;
          logInfo(`[Brain v6] [Double-Pass] Passagem 2: ${extractedPromisesFromAI.length} promessas extraídas`);
        }
        
        structuredVerdict = {
          credibilityScore: structuredResult?.credibilityScore || 50,
          contradictions: structuredResult?.contradictions || [],
          riskFactors: structuredResult?.riskFactors || [],
          finalVerdict: structuredResult?.finalVerdict || 'Análise inconclusiva'
        };
        
        logInfo(`[Brain v6] [Double-Pass] Credibilidade extraída: ${structuredVerdict.credibilityScore}%`);
      } catch (extractError) {
        logWarn(`[Brain v6] [Double-Pass] Falha na extração estruturada: ${extractError}`);
      }

    } catch (error) {
      logWarn(`[Brain v6] [Double-Pass] Falha no fluxo de IA, usando fallbacks...`);
      aiAnalysis = `Parecer técnico atualizado sobre ${cleanName} em ${region.state}. Análise baseada em dados oficiais disponíveis.`;
    }
    
    return { 
      finalReport: aiAnalysis, 
      finalPromises: extractedPromisesFromAI,
      structuredVerdict: structuredVerdict || {
        credibilityScore: 50,
        contradictions: [],
        riskFactors: [],
        finalVerdict: 'Análise em andamento'
      }
    };
  }

  private detectRegion(name: string): { state: string, city: string } {
    const n = name.toLowerCase();
    if (n.includes('jones manoel')) return { state: 'PE', city: 'Recife' };
    if (n.includes('erika hilton')) return { state: 'SP', city: 'São Paulo' };
    if (n.includes('arthur lira')) return { state: 'AL', city: 'Maceió' };
    return { state: 'Nacional', city: 'Brasília' };
  }

  private async runAbsenceCheck(cleanName: string, filteredSources: any[], region: any) {
    try {
      return await absenceAgent.checkAbsence(cleanName, 'GERAL');
    } catch (e) { return null; }
  }

  private async runVulnerabilityAudit(cleanName: string, rawSources: any[], filteredSources: any[]) {
    try {
      const evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 30)); // AUMENTADO de 10 para 30
      const vulnerabilityReport = await vulnerabilityAuditor.audit(cleanName, evidences);
      return { ...vulnerabilityReport, evidences };
    } catch (e) { return { evidences: [] }; }
  }

  private async runFinancialTraceability(cleanName: string, canonical: any) {
    try {
      const pixEmendas = await financeService.getPixEmendas(cleanName);
      return pixEmendas.map(f => ({
        statement: f.description,
        sourceTitle: f.source,
        sourceUrl: f.link || '',
        category: 'INSTITUTIONAL',
        impactScore: 50,
        context: `Valor: R$ ${f.value || 'N/A'}`
      }));
    } catch (e) { return []; }
  }

  private async runPoliticalBenchmarking(cleanName: string, canonical: any, dataSources: any) {
    try {
      if (!canonical || (!canonical.camara_id && !canonical.senado_id)) {
        return await proxyBenchmarkingAgent.getProxyAnalysis(cleanName);
      } else {
        return await benchmarkingAgent.compare(cleanName, dataSources);
      }
    } catch (e) { return null; }
  }

  private async persistAnalysis(userId: string | null, finalReport: string, cleanName: string, dataSources: any, finalResult: any, filteredSources: any[], existingId: string | null) {
    try {
      const supabase = getSupabase();
      const politicianData = dataSources.politician;
      
      const analysisData = {
        user_id: userId,
        text: finalReport,
        author: cleanName,
        category: 'GERAL',
        politician_name: cleanName,
        office: politicianData.office,
        party: politicianData.party,
        state: politicianData.state,
        status: 'completed',
        data_sources: JSON.stringify({
          absenceReport: finalResult.absenceReport,
          vulnerabilityReport: finalResult.vulnerabilityReport,
          benchmarkResult: finalResult.benchmarkResult,
          coherenceAnalysis: finalResult.coherenceAnalysis,
          promises: finalResult.promises,
          socialEvidences: finalResult.socialEvidences?.length || 0,
          legalRecords: finalResult.legalRecords?.length || 0,
          tseHistory: finalResult.tseHistory,
          consensusScore: finalResult.consensusMetrics?.consensusScore,
          dataLineage: finalResult.dataLineage,
          evidences: finalResult.evidences
        })
      };

      if (existingId) {
        await supabase.from('analyses').update(analysisData).eq('id', existingId);
      } else {
        await supabase.from('analyses').insert([analysisData]);
      }
      logInfo(`[Brain v6] Análise persistida com sucesso para ${cleanName}`);
    } catch (e) { logWarn(`[Brain v6] Erro na persistência: ${e}`); }
  }
}

export const brainAgent = new BrainAgent();
