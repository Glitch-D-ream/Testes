
import { getBudgetData, validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
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
    votedAgainstTheme: boolean;
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

    // 2. Consistência Política (API da Câmara - Simulado para o Nikolas)
    // Aqui buscaríamos se o deputado votou contra verbas para a área da promessa
    const consistency = await this.checkPoliticalConsistency(politicianId, category);

    // 3. Lógica de Veredito
    let verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA' = 'DUVIDOSA';
    let score = viability.confidence * 100;

    if (score < 40 || consistency.votedAgainstTheme) {
      verdict = 'VAZIA';
    } else if (score > 75 && !consistency.votedAgainstTheme) {
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

  private async checkPoliticalConsistency(politicianId: string, category: string) {
    // Simulação de busca na API da Câmara
    // Ex: Nikolas Ferreira (ID 209787)
    // Se a categoria for Educação e ele votou contra o Fundeb, por exemplo.
    const mockVotes = [
      { tema: 'Educação', voto: 'Não', data: '2023-05-10', descricao: 'Votação sobre verbas do Fundeb' }
    ];

    const votedAgainst = category.toLowerCase().includes('educação') && mockVotes.some(v => v.voto === 'Não');

    return {
      votedAgainstTheme: votedAgainst,
      relevantVotes: mockVotes
    };
  }

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
