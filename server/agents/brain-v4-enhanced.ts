
/**
 * BrainAgent v4 Enhanced
 * Integra: Scout Otimizado + Consensus Validator + Adversarial Learning
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { scoutHybridOptimized } from './scout-hybrid-optimized.ts';
import { filterAgentOptimized } from './filter-optimized.ts';
import { consensusValidatorService } from '../services/consensus-validator.service.ts';
import { adversarialLearningService } from '../services/adversarial-learning.service.ts';
import { aiService } from '../services/ai.service.ts';

export interface AnalysisReport {
  targetName: string;
  credibilityScore: number;
  consensusScore: number;
  verdict: any;
  dataLineage: string[];
  adversarialInsights: any[];
  generatedAt: string;
}

export class BrainAgentV4Enhanced {
  async analyze(targetName: string): Promise<AnalysisReport> {
    logInfo(`[BrainV4] Iniciando análise aprimorada de ${targetName}...`);
    
    const startTime = Date.now();
    const dataLineage: string[] = [];

    try {
      // FASE 1: Recuperar insights adversariais anteriores (Feedback Loop)
      logInfo(`[BrainV4] Fase 1: Recuperando insights adversariais anteriores...`);
      const priorInsights = await adversarialLearningService.getInsightsForTarget(targetName);
      const prioritySearchTerms = await adversarialLearningService.generatePrioritySearchTerms(targetName);
      
      if (prioritySearchTerms.length > 0) {
        logInfo(`[BrainV4] Termos de busca prioritários encontrados: ${prioritySearchTerms.join(', ')}`);
      }

      // FASE 2: Scout Otimizado (Triagem Inteligente)
      logInfo(`[BrainV4] Fase 2: Executando Scout Otimizado...`);
      const searchQueries = prioritySearchTerms.length > 0 
        ? prioritySearchTerms 
        : [targetName, `${targetName} promessas`, `${targetName} votações`, `${targetName} emendas`];

      const allSources: any[] = [];
      for (const query of searchQueries) {
        const sources = await scoutHybridOptimized.search(query);
        allSources.push(...sources);
        dataLineage.push(`Scout: ${query} (${sources.length} fontes)`);
      }

      logInfo(`[BrainV4] Scout coletou ${allSources.length} fontes (com triagem inteligente)`);

      // FASE 3: Preparar prompt para análise
      const analysisPrompt = `
        AUDITORIA FORENSE POLÍTICA - ANÁLISE APRIMORADA
        
        Alvo: ${targetName}
        
        Dados Coletados:
        ${allSources.map(s => `- ${s.title} (${s.credibilityLayer}): ${s.content?.substring(0, 200) || s.snippet || ''}`).join('\n')}
        
        Insights Adversariais Anteriores:
        ${priorInsights.map(i => `- [${i.severity}] ${i.theme}: ${i.source}`).join('\n') || 'Nenhum'}
        
        Tarefa: Gere um veredito técnico em JSON com:
        {
          "credibilityScore": 0-100,
          "mainFindings": ["achado1", "achado2"],
          "contradictions": ["contradição1"],
          "riskLevel": "critical|high|medium|low",
          "reasoning": "explicação técnica"
        }
      `;

      dataLineage.push(`Análise: Prompt preparado com ${allSources.length} fontes`);

      // FASE 4: Validação Cruzada (Consensus Validator)
      logInfo(`[BrainV4] Fase 4: Executando Validação Cruzada...`);
      const validationResult = await consensusValidatorService.validateWithCrossModel(analysisPrompt);
      
      logInfo(`[BrainV4] Consenso entre modelos: ${validationResult.consensusScore}%`);
      dataLineage.push(`Validação: ${validationResult.model1} vs ${validationResult.model2} (${validationResult.consensusScore}% consenso)`);

      // FASE 5: Registrar novos insights adversariais
      logInfo(`[BrainV4] Fase 5: Registrando novos insights adversariais...`);
      const finalVerdict = validationResult.finalVerdict;
      
      if (finalVerdict.contradictions && Array.isArray(finalVerdict.contradictions)) {
        for (const contradiction of finalVerdict.contradictions) {
          await adversarialLearningService.recordInsight({
            targetName,
            theme: contradiction,
            severity: finalVerdict.riskLevel || 'high',
            source: 'BrainV4-Analysis',
            evidenceUrl: allSources[0]?.url
          });
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      logInfo(`[BrainV4] Análise concluída em ${duration.toFixed(2)}s`);

      return {
        targetName,
        credibilityScore: finalVerdict.credibilityScore || 0,
        consensusScore: validationResult.consensusScore,
        verdict: finalVerdict,
        dataLineage,
        adversarialInsights: priorInsights,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logError(`[BrainV4] Erro na análise:`, error as Error);
      throw error;
    }
  }
}

export const brainAgentV4Enhanced = new BrainAgentV4Enhanced();
