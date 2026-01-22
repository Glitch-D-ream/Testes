
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

    // 3. Lógica de Veredito
    let verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA' = 'DUVIDOSA';
    let score = viability.confidence * 100;

    if (score < 40 || consistency.votedAgainst) {
      verdict = 'VAZIA';
    } else if (score > 75 && !consistency.votedAgainst) {
      verdict = 'REALISTA';
    }

    const explanation = this.generateExplanation(verdict, category, viability, consistency);

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

  private generateExplanation(verdict: string, category: string, viability: any, consistency: any): string {
    if (verdict === 'VAZIA') {
      return `Esta promessa é classificada como VAZIA porque, apesar de ser na área de ${category}, o histórico de votação do político mostra posicionamentos contrários ao investimento nesta área, e a taxa de execução orçamentária federal para este setor é de apenas ${viability.confidence * 100}%.`;
    }
    if (verdict === 'REALISTA') {
      return `Esta promessa tem alta viabilidade. O orçamento para ${category} tem sido executado de forma consistente e o político não possui votos contrários recentes a este tema.`;
    }
    return `Esta promessa é DUVIDOSA. Embora o orçamento exista, a execução histórica é instável e não há dados suficientes sobre a consistência política do autor neste tema específico.`;
  }
}

export const deepAuditor = new DeepAuditor();
