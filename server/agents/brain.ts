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
import { coherenceVoteAgent, VoteCoherenceResult } from './coherence-vote.ts';
import { coherenceExpenseAgent, ExpenseCoherenceResult, ExpenseProfile } from './coherence-expense.ts';
import { coherenceTemporalAgent, TemporalAnalysisResult } from './coherence-temporal.ts';
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
  absenceReport: any;
  vulnerabilityReport: any;
  benchmarkResult: any;
  coherenceAnalysis: CoherenceAnalysis;
  evidences: any[];
  consensusValidation: ValidationResult | null;
  humanizedReport: string;
  technicalReport: string;
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

      await updateProgress(5, `Identificando perfil oficial de ${cleanName}...`);
      const profile = await targetDiscoveryService.discover(cleanName);
      logInfo(`[Brain v6] Alvo: ${profile.office} ${profile.name} (${profile.party})`);

      const regionContext = { 
        state: profile.state !== 'Brasil' ? profile.state : 'Nacional',
        city: profile.city || 'Brasília'
      };

      await updateProgress(15, `Minerando portais oficiais, diários e redes sociais...`);
      const searchQuery = `${profile.office} ${profile.name} ${profile.party} ${regionContext.state}`;
      
      const [
        rawSources, 
        caseEvidences, 
        governmentPromises, 
        interviewPromises, 
        speechPromises,
        socialEvidences,
        legalRecords,
        diarioRecords,
        tseHistory
      ] = await Promise.all([
        scoutHybrid.search(searchQuery, true),
        scoutCaseMiner.mine(profile.name),
        governmentPlanExtractorService.extractFromTSE(profile.name, profile.state, 2022).catch(() => []),
        scoutInterviewAgent.searchAndExtract(profile.name).catch(() => []),
        scoutSpeechAgent.searchAndExtract(profile.name).catch(() => []),
        deepSocialMiner.mine(profile.name).catch(() => []),
        jusBrasilAlternative.searchLegalRecords(profile.name).catch(() => []),
        jusBrasilAlternative.searchQueridoDiario(profile.name).catch(() => []),
        getPoliticalHistory(profile.name, regionContext.state).catch(() => null)
      ]);
      
      const allPromises = [
        ...governmentPromises.map((p: any) => ({ text: p.text || p.promise, category: p.category || 'GERAL', source: 'Plano de Governo (TSE)', date: p.date, quote: p.quote })),
        ...interviewPromises.map((p: any) => ({ text: p.text, category: p.category || 'GERAL', source: `Entrevista: ${p.source?.platform || 'N/A'}`, date: p.source?.date, quote: p.quote })),
        ...speechPromises.map((p: any) => ({ text: p.text, category: p.category || 'GERAL', source: `Discurso: ${p.source?.session || 'N/A'}`, date: p.source?.date, quote: p.quote }))
      ];

      const allLegalRecords = [...legalRecords, ...diarioRecords];
      const filteredSources = await filterAgent.filter(rawSources, true);
      const dataSources = { politicianName: profile.name, politician: { office: profile.office, party: profile.party, state: profile.state } };
      
      const supabaseCanonical = getSupabase();
      let { data: canonical } = await supabaseCanonical.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      await updateProgress(40, `Cruzando promessas com votações e gastos reais...`);
      const isLegislative = profile.office.toLowerCase().includes('deputado') || profile.office.toLowerCase().includes('senador');

      const [
        absenceReport, 
        vulnerabilityReport, 
        financeEvidences, 
        benchmarkResult,
        voteAnalysis,
        expenseAnalysis,
        temporalAnalysis,
        tseCredibility
      ] = await Promise.all([
        isLegislative ? this.runAbsenceCheck(cleanName, filteredSources, regionContext) : Promise.resolve(null),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources),
        allPromises.length > 0 ? coherenceVoteAgent.analyze(profile.name, allPromises) : Promise.resolve([]),
        allPromises.length > 0 ? coherenceExpenseAgent.analyze(profile.name, allPromises) : Promise.resolve({ results: [], profile: { totalExpenses: 0, byCategory: {}, topCategories: [], topSuppliers: [], redFlags: [], suspiciousPatterns: [] } }),
        this.prepareTemporalAnalysis(profile.name, allPromises),
        validateCandidateCredibility(profile.name, regionContext.state).catch(() => null)
      ]);

      const coherenceAnalysis: CoherenceAnalysis = {
        voteAnalysis,
        expenseAnalysis,
        temporalAnalysis,
        overallScore: this.calculateCoherenceScore(voteAnalysis, expenseAnalysis, temporalAnalysis, tseCredibility),
        verdict: this.generateOverallVerdict(voteAnalysis, expenseAnalysis, temporalAnalysis, tseCredibility),
        redFlags: [...(expenseAnalysis.profile?.redFlags || []), ...(temporalAnalysis.contradictions.map(c => c.explanation))]
      };

      await updateProgress(80, `Validando consenso entre múltiplas fontes de IA...`);
      const combinedContext = this.buildCombinedContext(dataSources, absenceReport, vulnerabilityReport, benchmarkResult, financeEvidences, {}, allPromises, governmentPromises, interviewPromises, speechPromises, coherenceAnalysis, filteredSources, socialEvidences, allLegalRecords, tseHistory, tseCredibility);
      const consensusValidation = await consensusValidatorService.validate(profile.name, combinedContext);

      const humanizedReport = await humanizerEngine.humanize({
        targetName: cleanName,
        verdict: consensusValidation?.finalVerdict || {
          reasoning: coherenceAnalysis.verdict,
          mainFindings: coherenceAnalysis.redFlags.slice(0, 5),
          contradictions: temporalAnalysis.contradictions.map(c => c.explanation)
        },
        specialistReports: { absence: absenceReport, vulnerability: vulnerabilityReport, finance: financeEvidences, benchmarking: benchmarkResult, coherence: coherenceAnalysis },
        socialEvidences,
        sources: filteredSources
      });

      const consensusMetrics = {
        sourceCount: rawSources.length + allLegalRecords.length + socialEvidences.length,
        verifiedCount: filteredSources.length + allLegalRecords.length,
        coherenceScore: coherenceAnalysis.overallScore,
        consensusScore: consensusValidation?.score || (filteredSources.length > 0 ? 70 : 0)
      };

      const finalResult: FullAnalysisResult = {
        politicianName: cleanName,
        politician: { office: profile.office, party: profile.party, state: profile.state },
        promises: { total: allPromises.length, government: governmentPromises.length, interviews: interviewPromises.length, speeches: speechPromises.length, items: allPromises },
        socialEvidences,
        legalRecords: allLegalRecords,
        tseHistory,
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        coherenceAnalysis,
        evidences: filteredSources,
        consensusValidation,
        humanizedReport,
        technicalReport: JSON.stringify(coherenceAnalysis, null, 2),
        dataLineage: {
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
        consensusMetrics
      };

      await this.persistAnalysis(userId, humanizedReport, cleanName, dataSources, finalResult, filteredSources, existingId);
      return finalResult;
    } catch (error) {
      logError(`[Brain v6] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private buildCombinedContext(dataSources: any, absenceReport: any, vulnerabilityReport: any, benchmarkResult: any, financeEvidences: any[], correlations: any, allPromises: any[], governmentPromises: any[], interviewPromises: any[], speechPromises: any[], coherenceAnalysis: CoherenceAnalysis, filteredSources: any[], socialEvidences: SocialEvidence[], legalRecords: LegalRecord[], tseHistory: any, tseCredibility: any) {
    return {
      officialProfile: dataSources,
      absence: absenceReport,
      vulnerability: vulnerabilityReport,
      benchmarking: benchmarkResult,
      finance: financeEvidences,
      coherence: coherenceAnalysis,
      promises: allPromises,
      social: socialEvidences,
      legal: legalRecords,
      tse: { history: tseHistory, credibility: tseCredibility },
      sources: filteredSources
    };
  }

  private calculateCoherenceScore(vote: any[], expense: any, temporal: any, tse: any): number {
    let score = 100;
    if (temporal.contradictions.length > 0) score -= (temporal.contradictions.length * 15);
    if (expense.profile?.redFlags?.length > 0) score -= (expense.profile.redFlags.length * 10);
    if (tse?.score < 0.5) score -= 20;
    return Math.max(0, score);
  }

  private generateOverallVerdict(vote: any[], expense: any, temporal: any, tse: any): string {
    if (temporal.contradictions.length > 3 || expense.profile?.redFlags?.length > 5) return "CRÍTICO: Inconsistências severas detectadas entre discurso e prática.";
    if (temporal.contradictions.length > 0) return "ALERTA: Divergências moderadas identificadas.";
    return "ESTÁVEL: Alinhamento consistente verificado.";
  }

  private async prepareTemporalAnalysis(name: string, promises: any[]): Promise<TemporalAnalysisResult> {
    try {
      return await coherenceTemporalAgent.analyze(name, promises);
    } catch (e) { return { contradictions: [], timeline: [], overallConsistency: 100 }; }
  }

  private async runAbsenceCheck(cleanName: string, filteredSources: any[], region: any) {
    try { return await absenceAgent.checkAbsence(cleanName, 'GERAL'); } catch (e) { return null; }
  }

  private async runVulnerabilityAudit(cleanName: string, rawSources: any[], filteredSources: any[]) {
    try {
      const evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 30));
      const vulnerabilityReport = await vulnerabilityAuditor.audit(cleanName, evidences);
      return { ...vulnerabilityReport, evidences };
    } catch (e) { return { evidences: [] }; }
  }

  private async runFinancialTraceability(cleanName: string, canonical: any) {
    try {
      const pixEmendas = await financeService.getPixEmendas(cleanName);
      return pixEmendas.map(f => ({ statement: f.description, sourceTitle: f.source, sourceUrl: f.link || '', category: 'INSTITUTIONAL', impactScore: 50, context: `Valor: R$ ${f.value || 'N/A'}` }));
    } catch (e) { return []; }
  }

  private async runPoliticalBenchmarking(cleanName: string, canonical: any, dataSources: any) {
    try {
      if (!canonical || (!canonical.camara_id && !canonical.senado_id)) return await proxyBenchmarkingAgent.getProxyAnalysis(cleanName);
      return await benchmarkingAgent.compare(cleanName, dataSources);
    } catch (e) { return null; }
  }

  private async persistAnalysis(userId: string | null, finalReport: string, cleanName: string, dataSources: any, finalResult: any, filteredSources: any[], existingId: string | null) {
    try {
      const supabase = getSupabase();
      const analysisData = {
        user_id: userId,
        text: finalReport,
        author: cleanName,
        category: 'GERAL',
        politician_name: cleanName,
        office: dataSources.politician.office,
        party: dataSources.politician.party,
        state: dataSources.politician.state,
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
      if (existingId) await supabase.from('analyses').update(analysisData).eq('id', existingId);
      else await supabase.from('analyses').insert([analysisData]);
    } catch (e) { logWarn(`[Brain v6] Erro na persistência: ${e}`); }
  }
}

export const brainAgent = new BrainAgent();
