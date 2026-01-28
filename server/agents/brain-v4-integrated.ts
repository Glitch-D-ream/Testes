
/**
 * BrainAgent v4.1 Integrated (Humanized & Deep)
 * v4.1 - Focado em profundidade social e clareza para o cidadão
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybridOptimized } from './scout-hybrid-optimized.ts';
import { scoutCaseMiner } from './scout-case-miner.ts';
import { filterAgentOptimized } from './filter-optimized.ts';
import { absenceAgent } from './absence.ts';
import { vulnerabilityAuditor } from './vulnerability.ts';
import { benchmarkingAgent } from './benchmarking.ts';
import { consensusValidatorService } from '../services/consensus-validator.service.ts';
import { adversarialLearningService } from '../services/adversarial-learning.service.ts';
import { financeService } from '../services/finance.service.ts';
import { targetDiscoveryService } from '../services/target-discovery.service.ts';
import { coherenceService } from '../services/coherence.service.ts';
import { evidenceMiner } from '../modules/evidence-miner.ts';
import { deepSocialMiner } from './deep-social-miner.ts';
import { humanizerEngine } from '../services/humanizer-engine.ts';

export interface SpecialistReport {
  absence?: any;
  vulnerability?: any;
  finance?: any;
  benchmarking?: any;
  coherence?: any;
  social?: any[];
}

export interface AnalysisReport {
  targetName: string;
  profile: any;
  credibilityScore: number;
  consensusScore: number;
  verdict: any;
  specialistReports: SpecialistReport;
  humanizedReport: string;
  dataLineage: string[];
  generatedAt: string;
  processingTimeMs: number;
}

export class BrainAgentV4Integrated {
  async analyze(targetName: string): Promise<AnalysisReport> {
    const startTime = Date.now();
    logInfo(`[BrainV4.1] 🧠 Iniciando análise profunda e humanizada de ${targetName}...`);
    
    const dataLineage: string[] = [];
    const specialistReports: SpecialistReport = {};

    try {
      // 1. Descoberta de Alvo
      const profile = await targetDiscoveryService.discover(targetName);
      dataLineage.push(`Identidade: ${profile.office} ${profile.party}`);

      // 2. Coleta Multidimensional + SOCIAL DEEP
      logInfo(`[BrainV4.1] Coleta Multidimensional + Social...`);
      const [rawSources, caseEvidences, socialEvidences] = await Promise.all([
        scoutHybridOptimized.search(`${profile.office} ${profile.name}`),
        scoutCaseMiner.mine(profile.name),
        deepSocialMiner.mine(profile.name)
      ]);

      specialistReports.social = socialEvidences;
      dataLineage.push(`Coleta: ${rawSources.length} notícias, ${caseEvidences.length} casos, ${socialEvidences.length} sociais/blogs`);

      // 3. Triagem
      const filteredSources = await filterAgentOptimized.filter(rawSources);

      // 4. Auditoria Especializada (Paralela)
      const [absenceReport, vulnerabilityReport, financeReport, benchmarkResult, coherenceReport] = await Promise.all([
        this.runAbsenceAudit(profile),
        this.runVulnerabilityAudit(targetName, filteredSources),
        this.runFinancialTraceability(targetName),
        this.runBenchmarking(profile),
        this.runCoherenceAnalysis(targetName, filteredSources)
      ]);

      specialistReports.absence = absenceReport;
      specialistReports.vulnerability = vulnerabilityReport;
      specialistReports.finance = financeReport;
      specialistReports.benchmarking = benchmarkResult;
      specialistReports.coherence = coherenceReport;

      // 5. Validação Cruzada (Consenso)
      logInfo(`[BrainV4.1] Validação Cruzada...`);
      const consensusPrompt = this.buildDeepPrompt(targetName, profile, specialistReports, filteredSources);
      const validationResult = await consensusValidatorService.validateWithCrossModel(consensusPrompt);
      
      // 6. HUMANIZAÇÃO (Transformar dados técnicos em texto para o cidadão)
      logInfo(`[BrainV4.1] Humanizando resultado final...`);
      const humanizedReport = await humanizerEngine.humanize({
        targetName,
        verdict: validationResult.finalVerdict,
        specialistReports,
        socialEvidences,
        sources: filteredSources
      });

      const processingTimeMs = Date.now() - startTime;

      return {
        targetName,
        profile,
        credibilityScore: validationResult.finalVerdict.credibilityScore || 0,
        consensusScore: validationResult.consensusScore,
        verdict: validationResult.finalVerdict,
        specialistReports,
        humanizedReport,
        dataLineage,
        generatedAt: new Date().toISOString(),
        processingTimeMs
      };
    } catch (error) {
      logError(`[BrainV4.1] Erro na análise:`, error as Error);
      throw error;
    }
  }

  private buildDeepPrompt(targetName: string, profile: any, reports: SpecialistReport, sources: any[]): string {
    return `
      ANÁLISE PROFUNDA v4.1 - ${targetName}
      
      DADOS TÉCNICOS:
      - Faltas: ${reports.absence?.absences?.length || 0}
      - Emendas: ${reports.finance?.length || 0} registros
      - Vulnerabilidades: ${reports.vulnerability?.evidences?.length || 0}
      - Social/Blogs: ${reports.social?.length || 0} fontes
      
      EVIDÊNCIAS SOCIAIS (CITAÇÕES/POSTS):
      ${reports.social?.slice(0, 5).map(s => `- [${s.platform}] ${s.content.substring(0, 200)}`).join('\n')}
      
      FONTES NOTICIOSAS:
      ${sources.slice(0, 5).map(s => `- ${s.title}: ${s.snippet}`).join('\n')}
      
      TAREFA: Gere um veredito técnico JSON com credibilityScore, riskLevel, mainFindings, contradictions e reasoning.
    `;
  }

  // Métodos auxiliares run* omitidos para brevidade, mas permanecem os mesmos da v4.0
  private async runAbsenceAudit(profile: any): Promise<any> { try { return await absenceAgent.checkAbsence(profile.name, 'GERAL'); } catch (e) { return { absences: [] }; } }
  private async runVulnerabilityAudit(targetName: string, sources: any[]): Promise<any> { try { const evidences = await evidenceMiner.mine(targetName, sources.slice(0, 10)); return await vulnerabilityAuditor.audit(targetName, evidences); } catch (e) { return { evidences: [] }; } }
  private async runFinancialTraceability(targetName: string): Promise<any[]> { try { return await financeService.getPixEmendas(targetName); } catch (e) { return []; } }
  private async runBenchmarking(profile: any): Promise<any> { try { return await benchmarkingAgent.compare(profile.name, { politician: profile }); } catch (e) { return null; } }
  private async runCoherenceAnalysis(targetName: string, sources: any[]): Promise<any> { try { return await coherenceService.analyze(targetName, sources); } catch (e) { return { contradictions: [] }; } }
}

export const brainAgentV4Integrated = new BrainAgentV4Integrated();
