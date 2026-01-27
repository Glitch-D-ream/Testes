import { getSupabase } from '../core/database.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybrid } from './scout-hybrid.ts';
import { filterAgent, FilteredSource } from './filter.ts';
import { aiService } from '../services/ai.service.ts';
import { votingService } from '../services/voting.service.ts';
import { getProposicoesDeputado, getVotacoesDeputado } from '../integrations/camara.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { financeService } from '../services/finance.service.ts';
import { proxyBenchmarkingAgent } from './proxy-benchmarking.ts';
import axios from 'axios';

export class BrainAgent {
  async analyze(politicianName: string, userId: string | null = null, existingId: string | null = null) {
    const cleanName = politicianName.trim();
    logInfo(`[Brain] Iniciando análise profunda para: ${cleanName}`);

    try {
      const rawSources = await scoutHybrid.search(cleanName, true);
      const filteredSources = await filterAgent.filter(rawSources, true);
      const dataSources = await this.generateOfficialProfile(cleanName, filteredSources);
      const supabase = getSupabase();
      let { data: canonical } = await supabase.from('canonical_politicians').select('*').ilike('name', `%${cleanName}%`).maybeSingle();

      const [absenceReport, vulnerabilityReport, financeEvidences, benchmarkResult] = await Promise.all([
        this.runAbsenceCheck(cleanName, filteredSources),
        this.runVulnerabilityAudit(cleanName, rawSources, filteredSources),
        this.runFinancialTraceability(cleanName, canonical),
        this.runPoliticalBenchmarking(cleanName, canonical, dataSources)
      ]);

      let evidences = [...(vulnerabilityReport?.evidences || []), ...financeEvidences];
      const { finalReport, finalPromises } = await this.generateAIVeredict(cleanName, dataSources, filteredSources, rawSources);

      const finalResult = {
        ...dataSources,
        absenceReport,
        vulnerabilityReport,
        benchmarkResult,
        evidences,
        dataLineage: {
          vulnerability: 'Minerado via EvidenceMiner (Forense)',
          benchmarking: 'Baseado em dados do Supabase e APIs Oficiais',
          budget: 'SICONFI Snapshot',
          legislative: 'API Câmara/Senado'
        }
      };

      await this.persistAnalysis(userId, finalReport, cleanName, dataSources, finalResult, filteredSources, existingId);
      return finalResult;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${cleanName}`, error as Error);
      throw error;
    }
  }

  private async runAbsenceCheck(cleanName: string, filteredSources: any[]) {
    logInfo(`[Brain] Executando Agente de Ausência para ${cleanName}...`);
    try {
      const mainCat = filteredSources.length > 0 ? 'INFRASTRUCTURE' : 'GERAL';
      return await absenceAgent.checkAbsence(cleanName, mainCat);
    } catch (e) {
      logWarn(`[Brain] Falha no Agente de Ausência: ${e}`);
      return null;
    }
  }

  private async runVulnerabilityAudit(cleanName: string, rawSources: any[], filteredSources: any[]) {
    logInfo(`[Brain] Minerando evidências granulares para ${cleanName}...`);
    try {
      const evidences = await evidenceMiner.mine(cleanName, filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 10));
      logInfo(`[Brain] Mineradas ${evidences.length} evidências. Iniciando Auditoria Forense...`);
      const vulnerabilityReport = await vulnerabilityAuditor.audit(cleanName, evidences);
      return { ...vulnerabilityReport, evidences };
    } catch (e) {
      logWarn(`[Brain] Falha na Auditoria Forense: ${e}`);
      return { evidences: [] };
    }
  }

  private async runFinancialTraceability(cleanName: string, canonical: any) {
    logInfo(`[Brain] Executando Rastreabilidade Financeira para ${cleanName}...`);
    let financeEvidences: any[] = [];
    try {
      if (canonical && canonical.camara_id) {
        const [expenses, proposals] = await Promise.all([
          financeService.getParlamentaryExpenses(canonical.camara_id),
          financeService.getProposals(canonical.camara_id)
        ]);
        financeEvidences.push(...expenses, ...proposals);
      }
      const pixEmendas = await financeService.getPixEmendas(cleanName);
      financeEvidences.push(...pixEmendas);
      return financeEvidences.map(f => ({
        statement: f.description,
        sourceTitle: f.source,
        sourceUrl: f.link || '',
        category: f.type === 'EXPENSE' ? 'ECONOMY' : 'INSTITUTIONAL',
        impactScore: f.value ? Math.min(100, Math.floor(f.value / 10000)) : 50,
        context: `Valor: R$ ${f.value || 'N/A'} | Data: ${f.date}`
      }));
    } catch (e) {
      logWarn(`[Brain] Falha na Rastreabilidade Financeira: ${e}`);
      return [];
    }
  }

  private async runPoliticalBenchmarking(cleanName: string, canonical: any, dataSources: any) {
    logInfo(`[Brain] Executando Benchmarking Político para ${cleanName}...`);
    try {
      if (!canonical || (!canonical.camara_id && !canonical.senado_id)) {
        logInfo(`[Brain] Político sem mandato. Ativando Proxy Benchmarking para ${cleanName}...`);
        const proxyResult = await proxyBenchmarkingAgent.getProxyAnalysis(cleanName);
        return {
          politicianName: cleanName,
          comparisonGroup: 'Proxy Ideológico',
          metrics: { productivityScore: proxyResult.projectedProbabilityScore, consistencyScore: proxyResult.projectedProbabilityScore },
          uniqueness: proxyResult.reasoning,
          totalInGroup: proxyResult.proxiesUsed?.length || 0
        };
      } else {
        return await benchmarkingAgent.compare(cleanName, dataSources);
      }
    } catch (e) {
      logWarn(`[Brain] Falha no Benchmarking Político: ${e}`);
      return null;
    }
  }

  private async generateAIVeredict(cleanName: string, dataSources: any, filteredSources: any[], rawSources: any[]) {
    logInfo(`[Brain] Ativando VerdictEngine para ${cleanName}...`);
    const contextSources = filteredSources.length > 0 ? filteredSources : rawSources.slice(0, 5);
    const analysisPrompt = this.generateAnalysisPrompt(cleanName, dataSources, contextSources);

    let aiAnalysis = "";
    let extractedPromisesFromAI: any[] = [];

    try {
      logInfo(`[Brain] ETAPA 1: Gerando Parecer Técnico com DeepSeek R1...`);
      aiAnalysis = await aiService.generateReport(analysisPrompt);
      logInfo(`[Brain] ETAPA 2: Estruturando promessas com Groq...`);
      const structuredResult = await aiService.analyzeText(aiAnalysis);
      if (structuredResult?.promises) extractedPromisesFromAI = structuredResult.promises;
    } catch (error) {
      logWarn(`[Brain] Falha no VerdictEngine primário, tentando fallbacks...`);
      if (!aiAnalysis) aiAnalysis = await aiService.generateReport(analysisPrompt);
      if (extractedPromisesFromAI.length === 0) {
        const structuredResult = await aiService.analyzeText(aiAnalysis);
        extractedPromisesFromAI = structuredResult?.promises || [];
      }
    }

    if (extractedPromisesFromAI.length === 0 && filteredSources.length > 0) {
      logWarn('[Brain] IA não retornou promessas. Ativando fallback de NLP local...');
      const { extractPromises } = await import('../modules/nlp.ts');
      const allContent = filteredSources.map(s => s.content).join('\n\n');
      const nlpPromises = extractPromises(allContent);
      if (nlpPromises.length > 0) {
        logInfo(`[Brain] NLP local extraiu ${nlpPromises.length} promessas candidatas.`);
        extractedPromisesFromAI = nlpPromises.map(p => ({ ...p, reasoning: 'Extraído via análise de padrões linguísticos locais.' }));
      }
    }

    const finalReport = aiAnalysis && aiAnalysis.length > 100 ? aiAnalysis : `**PARECER TÉCNICO DE INTELIGÊNCIA**...`;
    return { finalReport, finalPromises: extractedPromisesFromAI };
  }

  private async persistAnalysis(userId: string | null, finalReport: string, cleanName: string, dataSources: any, finalResult: any, filteredSources: any[], existingId: string | null) {
    try {
      const { analysisService } = await import('../services/analysis.service.ts');
      
      // Garantir que dataSources.politician exista para evitar TypeError
      const politicianData = dataSources.politician || { office: 'N/A', party: 'N/A', state: 'N/A' };
      
      const analysisResult = await analysisService.createAnalysis(userId, finalReport, cleanName, dataSources.mainCategory || 'GERAL', {
        politicianName: dataSources.politicianName || cleanName,
        office: politicianData.office,
        party: politicianData.party,
        state: politicianData.state,
        absenceReport: finalResult.absenceReport,
        vulnerabilityReport: finalResult.vulnerabilityReport,
        benchmarkResult: finalResult.benchmarkResult,
        consensusMetrics: { sourceCount: filteredSources.length, verifiedCount: filteredSources.filter((s: any) => s.consensus_status === 'verified').length },
        contradictions: finalResult.vulnerabilityReport?.vulnerabilities || [],
        budgetVerdict: dataSources.budgetVerdict,
        budgetSummary: dataSources.budgetSummary,
        contrastAnalysis: dataSources.contrastAnalysis,
        projects: dataSources.projects,
        votingHistory: dataSources.votingHistory
      });
      logInfo(`[Brain] Análise persistida com sucesso. ID: ${analysisResult.id}`);
    } catch (e) {
      logWarn(`[Brain] Falha ao persistir métricas avançadas: ${e}`);
    }
  }

  private generateAnalysisPrompt(cleanName: string, dataSources: any, contextSources: any[]): string {
    return `**AUDITORIA FORENSE DE CONSISTÊNCIA POLÍTICA**...`;
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[]) {
    // Tentar obter perfil real da Câmara se possível
    const profile = { 
      politicianName, 
      mainCategory: 'Geral', 
      projects: [], 
      votingHistory: [],
      politician: { office: 'Deputado Federal', party: 'PSOL', state: 'SP' } // Mock para Erika Hilton, idealmente buscaria da API
    };
    return profile;
  }
}

export const brainAgent = new BrainAgent();
