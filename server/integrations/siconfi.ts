/**
 * Integração com SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público)
 * Fornece dados sobre orçamentos e execução de gastos públicos
 */

import axios from 'axios';
import logger from '../core/logger.js';
import { savePublicDataCache, getPublicDataCache } from '../core/database.js';

const SICONFI_API_BASE = 'https://apidatalake.tesouro.gov.br/api/siconfi';

export interface BudgetData {
  year: number;
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL';
  category: string;
  budgeted: number;
  executed: number;
  percentage: number;
  lastUpdated: Date;
}

export interface BudgetComparison {
  category: string;
  year: number;
  budgeted: number;
  executed: number;
  variance: number;
  executionRate: number;
}

/**
 * Buscar dados orçamentários de uma categoria específica
 */
export async function getBudgetData(
  category: string,
  year: number,
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'
): Promise<BudgetData | null> {
  try {
    // Tentar buscar do cache primeiro
    const cacheKey = `${category}_${year}_${sphere}`;
    const cached = await getPublicDataCache('SICONFI', cacheKey);
    if (cached) {
      return { ...cached, lastUpdated: new Date(cached.lastUpdated) };
    }

    logger.info(`[SICONFI] Buscando dados orçamentários: ${category} (${year})`);

    // Chamada à API SICONFI (Simulada para este exemplo, em produção usar endpoint real)
    // Nota: APIs governamentais costumam ser instáveis, o cache é fundamental
    const response = await axios.get(`${SICONFI_API_BASE}/orcamento`, {
      params: { categoria: category, ano: year, esfera: sphere },
      timeout: 10000,
    }).catch(() => ({ data: null }));

    if (!response.data || response.data.length === 0) {
      logger.warn(`[SICONFI] Nenhum dado real encontrado para: ${category} (${year})`);
      return null;
    }

    const data = response.data[0];
    const result: BudgetData = {
      year,
      sphere,
      category,
      budgeted: parseFloat(data.valor_orcado || 0),
      executed: parseFloat(data.valor_executado || 0),
      percentage: calculateExecutionRate(parseFloat(data.valor_orcado || 0), parseFloat(data.valor_executado || 0)),
      lastUpdated: new Date(),
    };

    await savePublicDataCache('SICONFI', cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`[SICONFI] Erro ao buscar dados: ${error}`);
    return null;
  }
}

export async function getBudgetHistory(
  category: string,
  startYear: number,
  endYear: number,
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'
): Promise<BudgetComparison[]> {
  const comparisons: BudgetComparison[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const data = await getBudgetData(category, year, sphere);
    if (data) {
      comparisons.push({
        category,
        year,
        budgeted: data.budgeted,
        executed: data.executed,
        variance: data.executed - data.budgeted,
        executionRate: data.percentage,
      });
    }
  }
  return comparisons;
}

export function calculateExecutionRate(budgeted: number, executed: number): number {
  if (budgeted === 0) return 0;
  return Math.min((executed / budgeted) * 100, 100);
}

export async function validateBudgetViability(
  category: string,
  estimatedValue: number,
  year: number,
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'
): Promise<{
  viable: boolean;
  confidence: number;
  reason: string;
  historicalData: BudgetComparison[];
}> {
  const currentYear = new Date().getFullYear();
  const history = await getBudgetHistory(category, Math.max(currentYear - 3, 2020), currentYear, sphere);

  if (history.length === 0) {
    return { viable: true, confidence: 0.3, reason: 'Sem dados históricos disponíveis', historicalData: [] };
  }

  const avgExecutionRate = history.reduce((sum, h) => sum + h.executionRate, 0) / history.length;
  const isViable = avgExecutionRate > 40; // Critério: pelo menos 40% de execução histórica

  return {
    viable: isViable,
    confidence: avgExecutionRate / 100,
    reason: `Taxa média de execução histórica para ${category}: ${avgExecutionRate.toFixed(1)}%`,
    historicalData: history,
  };
}

export function mapPromiseToSiconfiCategory(promiseCategory: string): string {
  const mapping: Record<string, string> = {
    EDUCATION: 'EDUCACAO',
    HEALTH: 'SAUDE',
    INFRASTRUCTURE: 'INFRAESTRUTURA',
    EMPLOYMENT: 'EMPREGO',
    ECONOMY: 'ECONOMIA',
    SECURITY: 'SEGURANCA',
  };
  return mapping[promiseCategory] || 'GERAL';
}

export async function syncSiconfiData(categories: string[]): Promise<void> {
  logger.info('[SICONFI] Iniciando sincronização de dados');
  const currentYear = new Date().getFullYear();
  for (const category of categories) {
    await getBudgetData(category, currentYear, 'FEDERAL');
  }
  logger.info('[SICONFI] Sincronização concluída');
}
