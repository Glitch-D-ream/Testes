/**
 * Módulo de cálculo de probabilidade de cumprimento de promessas
 * Baseado em dados históricos, viabilidade orçamentária e contexto
 */

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
 * Retorna um score de 0 a 100 (percentual)
 */
export function calculateProbability(
  promises: any[],
  author?: string,
  category?: string
): number {
  if (promises.length === 0) return 0;

  let totalScore = 0;

  for (const promise of promises) {
    const factors = calculateFactors(promise, author, category);
    const score = aggregateFactors(factors);
    totalScore += score;
  }

  return Math.round((totalScore / promises.length) * 100) / 100;
}

/**
 * Calcula os fatores individuais que influenciam a probabilidade
 */
function calculateFactors(
  promise: any,
  author?: string,
  category?: string
): ProbabilityFactors {
  return {
    promiseSpecificity: calculateSpecificity(promise),
    historicalCompliance: calculateHistoricalCompliance(author, category),
    budgetaryFeasibility: calculateBudgetaryFeasibility(promise, category),
    timelineFeasibility: calculateTimelineFeasibility(promise),
    authorTrack: calculateAuthorTrack(author)
  };
}

/**
 * Especificidade da promessa (0-1)
 * Promessas com números, prazos e metas claras têm maior especificidade
 */
function calculateSpecificity(promise: any): number {
  let score = 0.3; // Base

  // Promessas com números
  if (promise.entities?.numbers && promise.entities.numbers.length > 0) {
    score += 0.2;
  }

  // Promessas com prazos
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i)) {
    score += 0.2;
  }

  // Promessas com verbos de ação clara
  if (promise.entities?.verbs && promise.entities.verbs.length > 0) {
    score += 0.1;
  }

  // Comprimento da promessa (mais detalhes = mais específica)
  if (promise.text.length > 100) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

/**
 * Conformidade histórica (0-1)
 * Baseado em dados históricos de cumprimento de promessas similares
 * Nota: Em um MVP, usamos valores padrão. Em produção, seria consultado banco de dados
 */
function calculateHistoricalCompliance(author?: string, category?: string): number {
  // Valores padrão por categoria (baseado em dados históricos gerais)
  const categoryCompliance: Record<string, number> = {
    INFRASTRUCTURE: 0.35, // Obras públicas têm baixa taxa de cumprimento
    EDUCATION: 0.45,
    HEALTH: 0.40,
    EMPLOYMENT: 0.30, // Promessas de emprego raramente são cumpridas
    SECURITY: 0.25,
    ENVIRONMENT: 0.20, // Promessas ambientais têm baixa taxa
    SOCIAL: 0.35,
    ECONOMY: 0.30,
    AGRICULTURE: 0.40,
    CULTURE: 0.50
  };

  return categoryCompliance[category || 'GERAL'] || 0.35;
}

/**
 * Viabilidade orçamentária (0-1)
 * Avalia se a promessa é financeiramente viável
 * Nota: Em um MVP, usamos heurísticas. Em produção, seria consultado SICONFI
 */
function calculateBudgetaryFeasibility(promise: any, category?: string): number {
  let score = 0.5; // Base neutra

  // Promessas com números pequenos são mais viáveis
  if (promise.entities?.numbers && promise.entities.numbers.length > 0) {
    const numbers = promise.entities.numbers.map((n: string) => 
      parseInt(n.replace(/[^\d]/g, '')) || 0
    );
    const maxNumber = Math.max(...numbers);

    // Valores em milhões ou bilhões são menos viáveis
    if (promise.text.match(/bilhão/i)) {
      score -= 0.2;
    } else if (promise.text.match(/milhão/i)) {
      score -= 0.1;
    } else if (maxNumber < 1000000) {
      score += 0.2;
    }
  }

  // Categorias com maior orçamento disponível
  const budgetaryCategories: Record<string, number> = {
    INFRASTRUCTURE: 0.4,
    EDUCATION: 0.6,
    HEALTH: 0.5,
    EMPLOYMENT: 0.3,
    SECURITY: 0.5,
    ENVIRONMENT: 0.3,
    SOCIAL: 0.4,
    ECONOMY: 0.5,
    AGRICULTURE: 0.4,
    CULTURE: 0.3
  };

  score = budgetaryCategories[category || 'GERAL'] || 0.5;

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Viabilidade de prazo (0-1)
 * Avalia se o prazo proposto é realista
 */
function calculateTimelineFeasibility(promise: any): number {
  let score = 0.6; // Base

  // Extrair prazo se mencionado
  const timelineMatch = promise.text.match(/(\d+)\s*(dias?|semanas?|meses?|anos?)/i);
  
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1]);
    const unit = timelineMatch[2].toLowerCase();

    // Converter para dias
    let days = 0;
    if (unit.includes('dia')) days = value;
    else if (unit.includes('semana')) days = value * 7;
    else if (unit.includes('mês')) days = value * 30;
    else if (unit.includes('ano')) days = value * 365;

    // Prazos muito curtos são menos viáveis
    if (days < 30) {
      score -= 0.2;
    } else if (days < 90) {
      score -= 0.1;
    } else if (days > 1825) { // Mais de 5 anos
      score -= 0.15;
    } else {
      score += 0.1;
    }
  }

  return Math.min(Math.max(score, 0), 1);
}

/**
 * Histórico do autor (0-1)
 * Nota: Em um MVP, usamos valores padrão. Em produção, seria consultado TSE e histórico
 */
function calculateAuthorTrack(author?: string): number {
  // Valores padrão para diferentes tipos de autores
  // Nota: Isso seria consultado em um banco de dados real
  
  if (!author) return 0.5; // Neutro se autor desconhecido

  // Exemplo: políticos conhecidos por cumprir promessas teriam score maior
  // Isso seria implementado com consulta a dados históricos reais
  
  return 0.4; // Valor padrão conservador
}

/**
 * Agrega os fatores em um score final (0-1)
 */
function aggregateFactors(factors: ProbabilityFactors): number {
  // Pesos para cada fator
  const weights = {
    promiseSpecificity: 0.25,
    historicalCompliance: 0.25,
    budgetaryFeasibility: 0.20,
    timelineFeasibility: 0.15,
    authorTrack: 0.15
  };

  const score =
    factors.promiseSpecificity * weights.promiseSpecificity +
    factors.historicalCompliance * weights.historicalCompliance +
    factors.budgetaryFeasibility * weights.budgetaryFeasibility +
    factors.timelineFeasibility * weights.timelineFeasibility +
    factors.authorTrack * weights.authorTrack;

  return score;
}

/**
 * Calcula resultado completo com nível de risco
 */
export function calculateProbabilityWithDetails(
  promises: any[],
  author?: string,
  category?: string
): ProbabilityResult {
  if (promises.length === 0) {
    return {
      score: 0,
      factors: {
        promiseSpecificity: 0,
        historicalCompliance: 0,
        budgetaryFeasibility: 0,
        timelineFeasibility: 0,
        authorTrack: 0
      },
      riskLevel: 'ALTO',
      confidence: 0
    };
  }

  const allFactors: ProbabilityFactors[] = [];
  for (const promise of promises) {
    allFactors.push(calculateFactors(promise, author, category));
  }

  // Média dos fatores
  const avgFactors: ProbabilityFactors = {
    promiseSpecificity: allFactors.reduce((sum, f) => sum + f.promiseSpecificity, 0) / allFactors.length,
    historicalCompliance: allFactors.reduce((sum, f) => sum + f.historicalCompliance, 0) / allFactors.length,
    budgetaryFeasibility: allFactors.reduce((sum, f) => sum + f.budgetaryFeasibility, 0) / allFactors.length,
    timelineFeasibility: allFactors.reduce((sum, f) => sum + f.timelineFeasibility, 0) / allFactors.length,
    authorTrack: allFactors.reduce((sum, f) => sum + f.authorTrack, 0) / allFactors.length
  };

  const score = aggregateFactors(avgFactors);
  
  // Determinar nível de risco
  let riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
  if (score >= 0.65) {
    riskLevel = 'BAIXO';
  } else if (score >= 0.40) {
    riskLevel = 'MÉDIO';
  } else {
    riskLevel = 'ALTO';
  }

  return {
    score: Math.round(score * 100),
    factors: avgFactors,
    riskLevel,
    confidence: Math.round((promises.length > 0 ? 0.7 : 0) * 100) / 100
  };
}
