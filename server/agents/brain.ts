/**
 * Brain Agent v5.0 - SETH VII
 * 
 * Orquestrador principal com integração completa:
 * - Fase 1: Coleta de Promessas (Entrevistas, Discursos, Plano de Governo)
 * - Fase 2: Cruzamentos (Promessa vs Voto, Promessa vs Gasto, Temporal)
 * - Fase 3: Veredito Forense com evidências
 */

import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { scoutCaseMiner } from './scout-case-miner.ts';
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
// Novos agentes de coerência (Fase 2)
import { coherenceVoteAgent, VoteCoherenceResult } from './coherence-vote.ts';
import { coherenceExpenseAgent, ExpenseCoherenceResult, ExpenseProfile } from './coherence-expense.ts';
import { coherenceTemporalAgent, TemporalAnalysisResult } from './coherence-temporal.ts';

export interface CoherenceAnalysis {
  voteAnalysis: VoteCoherenceResult[];
  expenseAnalysis: { results: ExpenseCoherenceResult[]; profile: ExpenseProfile };
  temporalAnalysis: TemporalAnalysisResult;
  overallScore: number;
  verdict: string;
  redFlags: string[];
}

export class BrainAgent {
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain v5] Iniciando análise profunda para: ${cleanName}`);

    try {
      // ═══════════════════════════════════════════════════════════════════════
      // ETAPA 0: Descoberta de Identidade
      // ═══════════════════════════════════════════════════════════════════════
      const profile = await targetDiscoveryService.discover(cleanName);
      logInfo(`[Brain v5] Alvo: ${profile.office} ${profile.name} (${profile.party})`);

      const regionContext = { 
        state: profile.state !== 'Brasil' ? profile.state : this.detectRegion(cleanName).state,
        city: profile.city || this.detectRegion(cleanName).city
      };

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 1: COLETA DE PROMESSAS
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v5] === FASE 1: COLETA DE PROMESSAS ===`);
      
      const searchQuery = `${profile.office} ${profile.name} ${profile.party} ${regionContext.state}`;
      
      const [rawSources, caseEvidences, governmentPromises, interviewPromises, speechPromises] = await Promise.all([
        scoutHybrid.search(searchQuery, true),
        scoutCaseMiner.mine(profile.name),
        governmentPlanExtractorService.extractFromTSE(profile.name, profile.state, 2022).catch(() => []),
        scoutInterviewAgent.searchAndExtract(profile.name).catch(() => []),
        scoutSpeechAgent.searchAndExtract(profile.name).catch(() => [])
      ]);
      
      logInfo(`[Brain v5] Fontes: ${rawSources.length} | Casos: ${caseEvidences.length}`);
      logInfo(`[Brain v5] Promessas: Governo(${governmentPromises.length}) | Entrevistas(${interviewPromises.length}) | Discursos(${speechPromises.length})`);
      
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

      logInfo(`[Brain v5] Total de promessas consolidadas: ${allPromises.length}`);

      const filteredSources = await filterAgent.filter(rawSources, true);
      logInfo(`[Brain v5] Fontes filtradas: ${filteredSources.length}`);
      
      const dataSources = { 
        politicianName: profile.name, 
        politician: { office: profile.office, party: profile.party, state: profile.state } 
      };
      
      const supabase = getSupabase();
      let { data: canonical } = await supabase.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      // ═══════════════════════════════════════════════════════════════════════
      // FASE 2: CRUZAMENTOS E ANÁLISE DE COERÊNCIA
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v5] === FASE 2: CRUZAMENTOS E ANÁLISE DE COERÊNCIA ===`);
      
      const isLegislative = profile.office.toLowerCase().includes('deputado') || profile.office.toLowerCase().includes('senador');

      // Executar análises em paralelo
      const [
        absenceReport, 
        vulnerabilityReport, 
        financeEvidences, 
        benchmarkResult,
        voteAnalysis,
        expenseAnalysis,
        temporalAnalysis
      ] = await Promise.all([
        isLegislative ? this.runAbsenceCheck(cleanName, filteredSources, regionContext) : Promise.resolve(null),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources),
        // Novos agentes de coerência
        allPromises.length > 0 ? coherenceVoteAgent.analyze(profile.name, allPromises) : Promise.resolve([]),
        allPromises.length > 0 ? coherenceExpenseAgent.analyze(profile.name, allPromises) : Promise.resolve({ results: [], profile: { totalExpenses: 0, byCategory: {}, topCategories: [], redFlags: [] } }),
        this.prepareTemporalAnalysis(profile.name, allPromises)
      ]);

      logInfo(`[Brain v5] Análise de coerência concluída`);
      logInfo(`[Brain v5] - Votações analisadas: ${voteAnalysis.length}`);
      logInfo(`[Brain v5] - Gastos analisados: ${expenseAnalysis.results.length}`);
      logInfo(`[Brain v5] - Contradições temporais: ${temporalAnalysis.contradictions.length}`);

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
      // FASE 3: GERAÇÃO DO VEREDITO FORENSE
      // ═══════════════════════════════════════════════════════════════════════
      logInfo(`[Brain v5] === FASE 3: GERAÇÃO DO VEREDITO FORENSE ===`);

      const combinedContext = {
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
          voteAnalysis: voteAnalysis.map(v => ({
            promise: v.promise.text,
            score: v.coherenceScore,
            verdict: v.verdict,
            summary: v.summary,
            relatedVotes: v.relatedVotes.map(rv => ({
              proposicao: rv.vote.proposicao,
              voto: rv.vote.voto,
              relation: rv.relation,
              explanation: rv.explanation
            }))
          })),
          expenseAnalysis: {
            profile: expenseAnalysis.profile,
            results: expenseAnalysis.results.map(e => ({
              promise: e.promise.text,
              score: e.coherenceScore,
              verdict: e.verdict,
              summary: e.summary,
              redFlags: e.redFlags
            }))
          },
          temporalAnalysis: {
            score: temporalAnalysis.consistencyScore,
            summary: temporalAnalysis.summary,
            contradictions: temporalAnalysis.contradictions.map(c => ({
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
        sources: filteredSources.map(s => ({ title: s.title, content: s.content.substring(0, 800), url: s.url }))
      };

      const { finalReport, finalPromises } = await this.generateForensicVerdict(cleanName, combinedContext, filteredSources, rawSources, regionContext);

      const finalResult = {
        ...dataSources,
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        evidences,
        coherenceAnalysis,
        promises: {
          total: allPromises.length,
          government: governmentPromises.length,
          interviews: interviewPromises.length,
          speeches: speechPromises.length,
          items: allPromises.slice(0, 10) // Top 10 promessas
        },
        dataLineage: {
          vulnerability: 'Minerado via EvidenceMiner (Forense)',
          benchmarking: 'Baseado em dados do Supabase e APIs Oficiais',
          budget: 'SICONFI Snapshot',
          regional: `Portal Transparência ${regionContext.state}`,
          legislative: 'API Câmara/Senado',
          cases: 'Navegação profunda via Scout Case Miner v3.2',
          coherence: 'Análise de Coerência v1.0 (Vote, Expense, Temporal)'
        },
        consensusMetrics: {
          sourceCount: rawSources.length,
          verifiedCount: filteredSources.length,
          coherenceScore: coherenceAnalysis.overallScore
        }
      };

      await this.persistAnalysis(userId, finalReport, cleanName, dataSources, finalResult, filteredSources, existingId);
      return finalResult;
    } catch (error) {
      logError(`[Brain v5] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
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
    // Calcular médias
    const avgVoteScore = voteAnalysis.length > 0 
      ? Math.round(voteAnalysis.reduce((sum, r) => sum + r.coherenceScore, 0) / voteAnalysis.length)
      : 50;
    
    const avgExpenseScore = expenseAnalysis.results.length > 0
      ? Math.round(expenseAnalysis.results.reduce((sum, r) => sum + r.coherenceScore, 0) / expenseAnalysis.results.length)
      : 50;
    
    const temporalScore = temporalAnalysis.consistencyScore || 50;

    // Score geral ponderado
    const overallScore = Math.round(
      (avgVoteScore * 0.35) + 
      (avgExpenseScore * 0.35) + 
      (temporalScore * 0.30)
    );

    // Consolidar red flags
    const redFlags: string[] = [
      ...(expenseAnalysis.profile.redFlags || []),
      ...expenseAnalysis.results.flatMap(r => r.redFlags || []),
      ...temporalAnalysis.contradictions
        .filter(c => c.severity === 'HIGH')
        .map(c => `${c.type}: ${c.explanation}`)
    ];

    // Determinar veredito
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
      redFlags: [...new Set(redFlags)].slice(0, 10) // Top 10 red flags únicas
    };
  }

  private detectRegion(name: string): { state: string, city: string } {
    const n = name.toLowerCase();
    if (n.includes('jones manoel')) return { state: 'PE', city: 'Recife' };
    if (n.includes('erika hilton')) return { state: 'SP', city: 'São Paulo' };
    if (n.includes('arthur lira')) return { state: 'AL', city: 'Maceió' };
    return { state: 'Nacional', city: 'Brasília' };
  }

  /**
   * Gera veredito forense com análise de coerência integrada
   */
  private async generateForensicVerdict(cleanName: string, combinedContext: any, filteredSources: any[], rawSources: any[], region: any) {
    logInfo(`[Brain v5] Gerando Veredito Forense para ${cleanName}...`);
    
    let aiAnalysis = "";
    let extractedPromisesFromAI: any[] = [];

    try {
      const strictPrompt = `
DOSSIÊ DE INTELIGÊNCIA FORENSE - SETH VII v5.0 (COHERENCE ENGINE)
═══════════════════════════════════════════════════════════════════════════════

ALVO: ${cleanName}
IDENTIDADE: ${combinedContext.officialProfile.politician.office} (${combinedContext.officialProfile.politician.party})

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 1: ANÁLISE DE COERÊNCIA (NOVO)
═══════════════════════════════════════════════════════════════════════════════

SCORE GERAL DE COERÊNCIA: ${combinedContext.coherenceAnalysis.overallScore}%
VEREDITO: ${combinedContext.coherenceAnalysis.verdict}

PROMESSAS COLETADAS (${combinedContext.promises.all.length} total):
${combinedContext.promises.all.slice(0, 5).map((p: any, i: number) => `
${i+1}. [${p.category}] "${p.text}"
   Fonte: ${p.source}
   ${p.quote ? `Citação: "${p.quote}"` : ''}
`).join('')}

ANÁLISE PROMESSA vs VOTO:
${combinedContext.coherenceAnalysis.voteAnalysis.slice(0, 3).map((v: any) => `
- Promessa: "${v.promise.substring(0, 60)}..."
  Score: ${v.score}% | Veredito: ${v.verdict}
  ${v.summary}
`).join('')}

ANÁLISE PROMESSA vs GASTO:
Perfil Financeiro:
- Total: R$ ${combinedContext.coherenceAnalysis.expenseAnalysis.profile.totalExpenses?.toFixed(2) || 'N/A'}
- Top categorias: ${combinedContext.coherenceAnalysis.expenseAnalysis.profile.topCategories?.slice(0, 3).map((c: any) => `${c.category} (${c.percentage}%)`).join(', ') || 'N/A'}

${combinedContext.coherenceAnalysis.expenseAnalysis.results.slice(0, 3).map((e: any) => `
- Promessa: "${e.promise.substring(0, 60)}..."
  Score: ${e.score}% | Veredito: ${e.verdict}
  ${e.summary}
`).join('')}

CONTRADIÇÕES TEMPORAIS:
Score de Consistência: ${combinedContext.coherenceAnalysis.temporalAnalysis.score}%
${combinedContext.coherenceAnalysis.temporalAnalysis.contradictions.slice(0, 3).map((c: any) => `
- ${c.type} (${c.severity}): ${c.explanation}
  Diferença temporal: ${c.timeDifference}
`).join('')}

RED FLAGS:
${combinedContext.coherenceAnalysis.redFlags.slice(0, 5).map((r: string) => `⚠️ ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
SEÇÃO 2: DADOS COMPLEMENTARES
═══════════════════════════════════════════════════════════════════════════════

- PERFIL OFICIAL: ${JSON.stringify(combinedContext.officialProfile)}
- AUDITORIA DE AUSÊNCIA: ${JSON.stringify(combinedContext.absence)}
- VULNERABILIDADES: ${JSON.stringify(combinedContext.vulnerability)}
- CORRELAÇÕES: ${JSON.stringify(combinedContext.correlations)}
- FONTES PRIMÁRIAS: ${JSON.stringify(combinedContext.sources.slice(0, 5))}

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES PARA O PARECER
═══════════════════════════════════════════════════════════════════════════════

1. ESTRUTURA OBRIGATÓRIA:
   - QUADRO EXECUTIVO: Fatos de impacto imediato baseados na análise de coerência
   - CONTRADIÇÕES DETECTADAS: Liste as principais contradições entre promessa e prática
   - PERFIL FINANCEIRO: Analise os gastos vs promessas
   - VETORES DE RISCO: Vulnerabilidades e red flags com evidências
   - VEREDITO FORENSE: Parecer final com score de coerência

2. SEJA INCISIVO: Use os dados de coerência para fundamentar cada afirmação
3. CITE VALORES: Mencione R$, percentuais, datas específicas
4. CONECTE OS PONTOS: Relacione promessas com votos e gastos

PARECER TÉCNICO:`;

      aiAnalysis = await aiService.generateReport(strictPrompt);
      
      const extractionPrompt = `Extraia JSON de promessas do parecer: ${aiAnalysis}`;
      const structuredResult = await aiService.analyzeText(extractionPrompt);
      if (structuredResult?.promises) extractedPromisesFromAI = structuredResult.promises;
    } catch (error) {
      logWarn(`[Brain v5] Falha no fluxo de IA, usando fallbacks...`);
    }

    return { 
      finalReport: aiAnalysis || `Parecer técnico sobre ${cleanName}. Score de Coerência: ${combinedContext.coherenceAnalysis.overallScore}%`, 
      finalPromises: extractedPromisesFromAI 
    };
  }

  private async runAbsenceCheck(cleanName: string, filteredSources: any[], region: any) {
    try {
      return await absenceAgent.checkAbsence(cleanName, 'GERAL');
    } catch (e) { return null; }
  }

  private async runVulnerabilityAudit(cleanName: string, rawSources: any[], filteredSources: any[]) {
    try {
      const evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 10));
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
          dataLineage: finalResult.dataLineage,
          evidences: finalResult.evidences
        })
      };

      if (existingId) {
        await supabase.from('analyses').update(analysisData).eq('id', existingId);
      } else {
        await supabase.from('analyses').insert([analysisData]);
      }
      logInfo(`[Brain v5] Análise persistida com sucesso para ${cleanName}`);
    } catch (e) { logWarn(`[Brain v5] Erro na persistência: ${e}`); }
  }
}

export const brainAgent = new BrainAgent();
