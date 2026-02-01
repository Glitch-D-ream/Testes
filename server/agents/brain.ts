/**
 * Brain Agent v6.2 - SETH VII ASYNC-FIRST
 * 
 * Orquestrador otimizado para resposta imediata ao frontend.
 * O fluxo agora é:
 * 1. Servidor recebe pedido, cria ID e dispara GitHub Actions.
 * 2. Servidor responde IMEDIATAMENTE com status 'processing'.
 * 3. GitHub Actions (Worker) faz a coleta e chama a API de conclusão ou atualiza o Supabase.
 * 4. Frontend monitora via Realtime/Polling.
 */

import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { filterAgent } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { financeService } from '../services/finance.service.ts';
import { proxyBenchmarkingAgent } from './proxy-benchmarking.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';
import { coherenceVoteAgent, VoteCoherenceResult } from './coherence-vote.ts';
import { coherenceExpenseAgent, ExpenseCoherenceResult, ExpenseProfile } from './coherence-expense.ts';
import { coherenceTemporalAgent, TemporalAnalysisResult } from './coherence-temporal.ts';
import { validateCandidateCredibility } from '../integrations/tse.ts';
import { consensusValidatorService, ValidationResult } from '../services/consensus-validator.service.ts';
import { humanizerEngine } from '../services/humanizer-engine.ts';
import axios from 'axios';

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
  socialEvidences: any[];
  legalRecords: any[];
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
  /**
   * Ponto de entrada principal - DISPARO ASSÍNCRONO
   * Esta função deve retornar o mais rápido possível para evitar timeout no Railway/Vercel.
   */
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null): Promise<any> {
    const cleanName = politicianName.trim();
    logInfo(`[Brain v6.2] 🧠 Iniciando análise ASYNC para: ${cleanName}`);

    try {
      const supabase = getSupabase();
      
      // 1. Identificação rápida do perfil
      const profile = await targetDiscoveryService.discover(cleanName);
      
      // 2. Se não temos um existingId, criamos um agora para o frontend monitorar
      let analysisId = existingId;
      if (!analysisId) {
        const { data: newAnalysis, error: insertError } = await supabase
          .from('analyses')
          .insert([{
            politician_name: profile.name,
            office: profile.office,
            party: profile.party,
            state: profile.state,
            status: 'processing',
            progress: 5,
            text: 'Identificando perfil e disparando mineradores...'
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        analysisId = newAnalysis.id;
      }

      // 3. DISPARAR GITHUB ACTIONS (SEM AWAIT NO PROCESSAMENTO, APENAS NO DISPARO)
      logInfo(`[Brain v6.2] Disparando Worker para ID: ${analysisId}`);
      
      // Disparo em background - não usamos await na promessa de conclusão do Worker,
      // apenas na requisição de disparo para o GitHub.
      this.triggerGitHubWorker(profile, analysisId).catch(err => {
        logError(new Error(`Falha crítica ao disparar Worker: ${err.message}`));
      });

      // 4. RETORNAR IMEDIATAMENTE PARA O FRONTEND
      // O frontend agora deve usar Polling ou Realtime para ver o progresso
      return {
        id: analysisId,
        status: 'processing',
        message: 'A análise foi iniciada com sucesso. Os mineradores de IA estão trabalhando na nuvem.',
        politician: profile
      };

    } catch (error: any) {
      logError(`[Brain v6.2] Falha no disparo da análise: ${cleanName}`, error);
      throw error;
    }
  }

  /**
   * Dispara o Worker do GitHub Actions
   */
  private async triggerGitHubWorker(profile: any, analysisId: string) {
    try {
      await axios.post(
        `https://api.github.com/repos/Glitch-D-ream/Testes/dispatches`,
        {
          event_type: 'run-scout-orchestrator',
          client_payload: {
            politicianName: profile.name,
            analysisId: analysisId,
            state: profile.state
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
          },
          timeout: 10000 // Timeout curto para o disparo
        }
      );
      logInfo(`[Brain v6.2] GitHub Actions disparado para ${profile.name}`);
    } catch (e: any) {
      const supabase = getSupabase();
      await supabase.from('analyses').update({
        status: 'error',
        text: `Erro ao iniciar mineradores na nuvem: ${e.message}`
      }).eq('id', analysisId);
      throw e;
    }
  }

  /**
   * Esta função agora será chamada pelo próprio Worker ou por um script de conclusão
   * para finalizar o processamento após a coleta.
   */
  async finalizeAnalysis(analysisId: string, scoutData: any): Promise<FullAnalysisResult> {
    logInfo(`[Brain v6.2] 🏁 Finalizando análise para ID: ${analysisId}`);
    const supabase = getSupabase();

    try {
      const { data: analysis } = await supabase.from('analyses').select('*').eq('id', analysisId).single();
      if (!analysis) throw new Error('Análise não encontrada para finalização.');

      const cleanName = analysis.politician_name;
      const profile = { name: cleanName, office: analysis.office, party: analysis.party, state: analysis.state };

      // Reutilizar a lógica de processamento da v6.1 aqui...
      const {
        rawSources, caseEvidences, governmentPromises, interviewPromises, 
        speechPromises, socialEvidences, legalRecords, tseHistory
      } = scoutData;

      const allPromises = [
        ...governmentPromises.map((p: any) => ({ text: p.text || p.promise, category: p.category || 'GERAL', source: 'Plano de Governo (TSE)', date: p.date, quote: p.quote })),
        ...interviewPromises.map((p: any) => ({ text: p.text, category: p.category || 'GERAL', source: `Entrevista: ${p.source?.platform || 'N/A'}`, date: p.source?.date, quote: p.quote })),
        ...speechPromises.map((p: any) => ({ text: p.text, category: p.category || 'GERAL', source: `Discurso: ${p.source?.session || 'N/A'}`, date: p.source?.date, quote: p.quote }))
      ];

      const filteredSources = await filterAgent.filter(rawSources, true);
      const dataSources = { politicianName: profile.name, politician: { office: profile.office, party: profile.party, state: profile.state } };
      
      let { data: canonical } = await supabase.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      const [
        absenceReport, vulnerabilityReport, financeEvidences, benchmarkResult,
        voteAnalysis, expenseAnalysis, temporalAnalysis, tseCredibility
      ] = await Promise.all([
        profile.office.toLowerCase().includes('deputado') ? this.runAbsenceCheck(cleanName, filteredSources, { state: profile.state }) : Promise.resolve(null),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources),
        allPromises.length > 0 ? coherenceVoteAgent.analyze(profile.name, allPromises) : Promise.resolve([]),
        allPromises.length > 0 ? coherenceExpenseAgent.analyze(profile.name, allPromises) : Promise.resolve({ results: [], profile: { totalExpenses: 0, byCategory: {}, topCategories: [], topSuppliers: [], redFlags: [], suspiciousPatterns: [] } }),
        this.prepareTemporalAnalysis(profile.name, allPromises),
        validateCandidateCredibility(profile.name, profile.state).catch(() => null)
      ]);

      const coherenceAnalysis: CoherenceAnalysis = {
        voteAnalysis, expenseAnalysis, temporalAnalysis,
        overallScore: this.calculateCoherenceScore(voteAnalysis, expenseAnalysis, temporalAnalysis, tseCredibility),
        verdict: this.generateOverallVerdict(voteAnalysis, expenseAnalysis, temporalAnalysis, tseCredibility),
        redFlags: [...(expenseAnalysis.profile?.redFlags || []), ...(temporalAnalysis.contradictions.map(c => c.explanation))]
      };

      const combinedContext = this.buildCombinedContext(dataSources, absenceReport, vulnerabilityReport, benchmarkResult, financeEvidences, {}, allPromises, governmentPromises, interviewPromises, speechPromises, coherenceAnalysis, filteredSources, socialEvidences, legalRecords, tseHistory, tseCredibility);
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

      const finalResult: FullAnalysisResult = {
        politicianName: cleanName,
        politician: profile,
        promises: { total: allPromises.length, government: governmentPromises.length, interviews: interviewPromises.length, speeches: speechPromises.length, items: allPromises },
        socialEvidences, legalRecords, tseHistory, absenceReport, vulnerabilityReport, benchmarkResult, coherenceAnalysis, evidences: filteredSources, consensusValidation, humanizedReport,
        technicalReport: JSON.stringify(coherenceAnalysis, null, 2),
        dataLineage: { scoutOrchestrator: 'GitHub Actions Cloud', coherence: 'v2.0', humanization: 'v1.0' },
        consensusMetrics: {
          sourceCount: rawSources.length + legalRecords.length + socialEvidences.length,
          verifiedCount: filteredSources.length + legalRecords.length,
          coherenceScore: coherenceAnalysis.overallScore,
          consensusScore: consensusValidation?.score || 70
        }
      };

      await this.persistAnalysis(null, humanizedReport, cleanName, dataSources, finalResult, filteredSources, analysisId);
      return finalResult;

    } catch (error: any) {
      logError(`[Brain v6.2] Erro na finalização: ${error.message}`);
      await supabase.from('analyses').update({ status: 'error', text: `Erro na finalização: ${error.message}` }).eq('id', analysisId);
      throw error;
    }
  }

  // Métodos auxiliares (mantidos da v6.1)
  private buildCombinedContext(dataSources: any, absenceReport: any, vulnerabilityReport: any, benchmarkResult: any, financeEvidences: any[], correlations: any, allPromises: any[], governmentPromises: any[], interviewPromises: any[], speechPromises: any[], coherenceAnalysis: CoherenceAnalysis, filteredSources: any[], socialEvidences: any[], legalRecords: any[], tseHistory: any, tseCredibility: any) {
    return { officialProfile: dataSources, absence: absenceReport, vulnerability: vulnerabilityReport, benchmarking: benchmarkResult, finance: financeEvidences, coherence: coherenceAnalysis, promises: allPromises, social: socialEvidences, legal: legalRecords, tse: { history: tseHistory, credibility: tseCredibility }, sources: filteredSources };
  }

  private calculateCoherenceScore(vote: any[], expense: any, temporal: any, tse: any): number {
    let score = 100;
    if (temporal.contradictions.length > 0) score -= (temporal.contradictions.length * 15);
    if (expense.profile?.redFlags?.length > 0) score -= (expense.profile.redFlags.length * 10);
    if (tse?.score < 0.5) score -= 20;
    return Math.max(0, score);
  }

  private generateOverallVerdict(vote: any[], expense: any, temporal: any, tse: any): string {
    if (temporal.contradictions.length > 3 || expense.profile?.redFlags?.length > 5) return "CRÍTICO: Inconsistências severas detectadas.";
    return "ESTÁVEL: Alinhamento consistente verificado.";
  }

  private async prepareTemporalAnalysis(name: string, promises: any[]): Promise<TemporalAnalysisResult> {
    try { return await coherenceTemporalAgent.analyze(name, promises); } catch (e) { return { contradictions: [], timeline: [], overallConsistency: 100 }; }
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
        text: finalReport,
        status: 'completed',
        progress: 100,
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
      await supabase.from('analyses').update(analysisData).eq('id', existingId);
    } catch (e) { logWarn(`[Brain v6.2] Erro na persistência: ${e}`); }
  }
}

export const brainAgent = new BrainAgent();
