/**
 * Módulo de cálculo de probabilidade de cumprimento de promessas
 * Baseado em dados históricos, viabilidade orçamentária e contexto
 */

import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
import { validateCandidateCredibility } from '../integrations/tse.js';

export interface ProbabilityFactors {
  promiseSpecificity: number;
  historicalCompliance: number;
  budgetaryFeasibility: number;
  timelineFeasibility: number;
  authorTrack: number;
}

export interface ProbabilityResult {
  score: number;
  factors: ProbabilityFactors;
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
  confidence: number;
}

/**
 * Calcula a probabilidade de cumprimento de uma promessa
 */
export async function calculateProbability(
  promises: any[],
  author?: string,
  category?: string
): Promise<number> {
  const result = await calculateProbabilityWithDetails(promises, author, category);
  return result.score;
}

/**
 * Calcula os fatores individuais que influenciam a probabilidade
 */
async function calculateFactors(
  promise: any,
  author?: string,
  category?: string
): Promise<ProbabilityFactors> {
  // 1. Especificidade (Linguística)
  const specificity = calculateSpecificity(promise);
  
  // 2. Viabilidade Orçamentária (Dados Reais SICONFI)
  const siconfiCategory = mapPromiseToSiconfiCategory(category || 'GERAL');
  const budgetValidation = await validateBudgetViability(siconfiCategory, 0, new Date().getFullYear());
  
  // 3. Histórico do Autor (Dados Reais TSE)
  const authorValidation = author ? await validateCandidateCredibility(author, 'BR') : null;

  return {
    promiseSpecificity: specificity,
    historicalCompliance: budgetValidation.confidence,
    budgetaryFeasibility: budgetValidation.viable ? 0.8 : 0.3,
    timelineFeasibility: calculateTimelineFeasibility(promise),
    authorTrack: authorValidation ? authorValidation.score : 0.5
  };
}

function calculateSpecificity(promise: any): number {
  let score = 0.2;
  // Presença de números (valores, quantidades)
  if (promise.text.match(/\d+/)) score += 0.2;
  // Datas ou prazos
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia|202\d)\b/i)) score += 0.2;
  // Verbos de ação concreta
  if (promise.text.match(/\b(construir|entregar|criar|reduzir|aumentar|reformar|implementar)\b/i)) score += 0.2;
  // Extensão do texto (detalhamento)
  if (promise.text.length > 120) score += 0.2;
  
  return Math.min(score, 1);
}

function calculateTimelineFeasibility(promise: any): number {
  let score = 0.5;
  const text = promise.text.toLowerCase();
  
  // Prazos muito curtos para obras complexas
  if (text.match(/\b(hospital|escola|ponte|estrada|rodovia|aeroporto)\b/) && text.match(/\b(meses|dias|1 ano)\b/)) {
    score -= 0.3;
  }
  
  // Prazos eleitorais (4 anos)
  if (text.match(/\b(4 anos|mandato|até o fim)\b/)) {
    score += 0.2;
  }

  const timelineMatch = text.match(/(\d+)\s*(dias?|semanas?|meses?|anos?)/i);
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1]);
    const unit = timelineMatch[2].toLowerCase();
    let days = unit.includes('dia') ? value : unit.includes('semana') ? value * 7 : unit.includes('mês') ? value * 30 : value * 365;
    
    if (days < 30) score -= 0.1;
    else if (days > 1460) score -= 0.2; // Mais de um mandato
    else score += 0.1;
  }
  
  return Math.min(Math.max(score, 0), 1);
}

function aggregateFactors(factors: ProbabilityFactors): number {
  const weights = {
    promiseSpecificity: 0.20,
    historicalCompliance: 0.25,
    budgetaryFeasibility: 0.25,
    timelineFeasibility: 0.10,
    authorTrack: 0.20
  };

  return (
    factors.promiseSpecificity * weights.promiseSpecificity +
    factors.historicalCompliance * weights.historicalCompliance +
    factors.budgetaryFeasibility * weights.budgetaryFeasibility +
    factors.timelineFeasibility * weights.timelineFeasibility +
    factors.authorTrack * weights.authorTrack
  );
}

export async function calculateProbabilityWithDetails(
  promises: any[],
  author?: string,
  category?: string
): Promise<ProbabilityResult> {
  if (promises.length === 0) {
    return {
      score: 0,
      factors: { promiseSpecificity: 0, historicalCompliance: 0, budgetaryFeasibility: 0, timelineFeasibility: 0, authorTrack: 0 },
      riskLevel: 'ALTO',
      confidence: 0
    };
  }

  // 1. Calcular fatores externos apenas UMA VEZ por análise (SICONFI e TSE)
  const siconfiCategory = mapPromiseToSiconfiCategory(category || 'GERAL');
  const budgetValidation = await validateBudgetViability(siconfiCategory, 0, new Date().getFullYear());
  const authorValidation = author ? await validateCandidateCredibility(author, 'BR') : null;

  const allFactors: ProbabilityFactors[] = [];
  for (const promise of promises) {
    // 2. Calcular fatores específicos da promessa (Linguística e Cronograma)
    const specificity = calculateSpecificity(promise);
    const timeline = calculateTimelineFeasibility(promise);

    allFactors.push({
      promiseSpecificity: specificity,
      historicalCompliance: budgetValidation.confidence,
      budgetaryFeasibility: budgetValidation.viable ? 0.8 : 0.3,
      timelineFeasibility: timeline,
      authorTrack: authorValidation ? authorValidation.score : 0.5
    });
  }

  const avgFactors: ProbabilityFactors = {
    promiseSpecificity: allFactors.reduce((sum, f) => sum + f.promiseSpecificity, 0) / allFactors.length,
    historicalCompliance: allFactors.reduce((sum, f) => sum + f.historicalCompliance, 0) / allFactors.length,
    budgetaryFeasibility: allFactors.reduce((sum, f) => sum + f.budgetaryFeasibility, 0) / allFactors.length,
    timelineFeasibility: allFactors.reduce((sum, f) => sum + f.timelineFeasibility, 0) / allFactors.length,
    authorTrack: allFactors.reduce((sum, f) => sum + f.authorTrack, 0) / allFactors.length
  };

  const score = aggregateFactors(avgFactors);
  
  let riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
  if (score >= 0.60) riskLevel = 'BAIXO';
  else if (score >= 0.35) riskLevel = 'MÉDIO';
  else riskLevel = 'ALTO';

  return {
    score: score, // Retornar entre 0 e 1 para consistência
    factors: avgFactors,
    riskLevel,
    confidence: 0.85 // Alta confiança devido ao uso de dados reais
  };
}
