
import { getBudgetData, validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
import { votingService } from '../services/voting.service.js';
import { logInfo, logError } from '../core/logger.js';
import axios from 'axios';

export interface AuditReport {
  promise: string;
  category: string;
  viabilityScore: number;
  budgetContext: {
    totalBudget: number;
    executedBudget: number;
    executionRate: number;
  };
  politicalConsistency: {
    votedAgainst: boolean;
    relevantVotes: any[];
  };
  verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA';
  explanation: string;
}

export class DeepAuditor {
  /**
   * Realiza uma auditoria profunda em uma promessa específica
   */
  async auditPromise(promiseText: string, category: string, politicianId: string): Promise<AuditReport> {
    logInfo(`[Auditor] Iniciando auditoria profunda: "${promiseText}"`);

    // 1. Confronto Orçamentário (SICONFI)
    const siconfiCat = mapPromiseToSiconfiCategory(category.toUpperCase());
    const budgetInfo = await getBudgetData(siconfiCat, 2024, 'FEDERAL');
    const viability = await validateBudgetViability(siconfiCat, 0, 2024);

    // 2. Consistência Política (API da Câmara - REAL)
    const consistency = await votingService.checkInconsistency(politicianId, category);

    // 3. Lógica de Veredito Baseada em Dados Reais
    let verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA' = 'DUVIDOSA';
    
    // Se não temos dados orçamentários nem históricos, não podemos classificar como Realista ou Vazia com confiança
    const hasBudgetData = budgetInfo !== null;
    const hasVotingData = consistency.relevantVotes.length > 0;
    
    let score = viability.confidence * 100;

    if (hasBudgetData && hasVotingData) {
      if (score < 30 || consistency.votedAgainst) {
        verdict = 'VAZIA';
      } else if (score > 70 && !consistency.votedAgainst) {
        verdict = 'REALISTA';
      }
    } else if (!hasBudgetData && !hasVotingData) {
      verdict = 'DUVIDOSA';
      score = 50; // Neutro por falta de dados
    }

    const explanation = this.generateExplanation(verdict, category, viability, consistency, hasBudgetData, hasVotingData);

    return {
      promise: promiseText,
      category,
      viabilityScore: Math.round(score),
      budgetContext: {
        totalBudget: budgetInfo?.budgeted || 0,
        executedBudget: budgetInfo?.executed || 0,
        executionRate: budgetInfo?.percentage || 0
      },
      politicalConsistency: consistency,
      verdict,
      explanation
    };
  }

  // O método checkPoliticalConsistency foi substituído pelo votingService.checkInconsistency real

  private generateExplanation(verdict: string, category: string, viability: any, consistency: any, hasBudget: boolean, hasVoting: boolean): string {
    let text = "";
    
    if (!hasBudget && !hasVoting) {
      return `Não foi possível encontrar dados orçamentários ou histórico de votação suficiente para validar esta promessa de ${category} de forma conclusiva.`;
    }

    if (verdict === 'VAZIA') {
      text = `Esta promessa apresenta sinais de inconsistência. `;
      if (consistency.votedAgainst) text += `O político já votou contra medidas relacionadas a ${category} no passado. `;
      if (viability.confidence < 0.4) text += `Além disso, a execução orçamentária real para este setor está abaixo da média histórica (${(viability.confidence * 100).toFixed(0)}%).`;
      return text;
    }
    
    if (verdict === 'REALISTA') {
      return `Esta promessa possui base em dados reais. O setor de ${category} apresenta execução orçamentária sólida e não foram encontrados votos contrários do autor sobre o tema.`;
    }
    
    return `Análise inconclusiva. Embora existam dados, a execução orçamentária para ${category} é instável ou o histórico político do autor é misto em relação a este tema.`;
  }
}

export const deepAuditor = new DeepAuditor();
