import { logInfo, logWarn } from '../core/logger.ts';
import { getBudgetData, getBudgetHistory } from '../integrations/siconfi.ts';

export interface TrajectoryAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  deviation: number; // Desvio padrão
  isAnomaly: boolean;
  justification: string;
}

export class TrajectoryModule {
  /**
   * Analisa a trajetória de uma categoria orçamentária e detecta anomalias
   */
  async analyzeBudgetTrajectory(category: string, sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'): Promise<TrajectoryAnalysis> {
    logInfo(`[Trajectory] Analisando trajetória para ${category}`);
    
    const currentYear = new Date().getFullYear();
    const history = await getBudgetHistory(category, currentYear - 5, currentYear - 1, sphere);
    
    if (history.length < 3) {
      return {
        trend: 'stable',
        deviation: 0,
        isAnomaly: false,
        justification: 'Dados históricos insuficientes para análise de trajetória.'
      };
    }

    const values = history.map(h => h.budgeted);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    // 1. Calcular Desvio Padrão
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    // 2. Calcular Tendência (Regressão Linear Simples - Inclinação)
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * values[i], 0);
    const sumXX = x.reduce((a, i) => a + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    const trend = slope > (avg * 0.05) ? 'increasing' : (slope < -(avg * 0.05) ? 'decreasing' : 'stable');

    // 3. Detectar Anomalia (Se o último valor desvia mais de 2 desvios padrão da média)
    const lastValue = values[values.length - 1];
    const isAnomaly = Math.abs(lastValue - avg) > (2 * stdDev);

    let justification = `Tendência ${trend === 'increasing' ? 'de alta' : (trend === 'decreasing' ? 'de queda' : 'estável')} nos últimos ${n} anos.`;
    if (isAnomaly) {
      justification += ` Alerta: O último registro apresenta um desvio atípico (${(Math.abs(lastValue - avg) / stdDev).toFixed(1)} sigmas).`;
    }

    return {
      trend,
      deviation: stdDev,
      isAnomaly,
      justification
    };
  }

  /**
   * Verifica se uma promessa representa uma contradição com a trajetória histórica
   */
  async checkPromiseContradiction(promiseText: string, category: string, estimatedValue: number): Promise<{
    isContradictory: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
  }> {
    const trajectory = await this.analyzeBudgetTrajectory(category);
    
    const isReductionPromise = /\b(cortar|reduzir|diminuir|conter|economizar)\b/i.test(promiseText);
    const isExpansionPromise = /\b(aumentar|investir|criar|expandir|construir)\b/i.test(promiseText);

    if (isReductionPromise && trajectory.trend === 'increasing') {
      return {
        isContradictory: true,
        severity: 'medium',
        reason: `A promessa de redução contraria a tendência histórica de crescimento de gastos em ${category}.`
      };
    }

    if (isExpansionPromise && trajectory.trend === 'decreasing') {
      return {
        isContradictory: true,
        severity: 'high',
        reason: `A promessa de expansão é altamente improvável dado o cenário de cortes sucessivos em ${category}.`
      };
    }

    return {
      isContradictory: false,
      severity: 'low',
      reason: 'A promessa é coerente com a trajetória histórica ou os dados são inconclusivos.'
    };
  }
}

export const trajectoryModule = new TrajectoryModule();
