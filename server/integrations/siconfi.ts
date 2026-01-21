/**
 * Integração com SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público)
 * Fornece dados sobre orçamentos e execução de gastos públicos
 * 
 * API: https://apidatalake.tesouro.gov.br/docs/siconfi/
 * Dados: Receitas, despesas, investimentos por esfera (federal, estadual, municipal)
 */

import axios from 'axios';
import logger from '../core/logger.js';

const SICONFI_API_BASE = 'https://apidatalake.tesouro.gov.br/api/siconfi';

export interface BudgetData {
  year: number;
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL';
  category: string;
  budgeted: number; // Valor orçado
  executed: number; // Valor executado
  percentage: number; // Percentual de execução
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
    logger.info(`[SICONFI] Buscando dados orçamentários: ${category} (${year})`);

    // Simular chamada à API SICONFI
    // Em produção, fazer chamada real à API
    const response = await axios.get(`${SICONFI_API_BASE}/orcamento`, {
      params: {
        categoria: category,
        ano: year,
        esfera: sphere,
      },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      logger.warn(`[SICONFI] Nenhum dado encontrado para ${category}`);
      return null;
    }

    const data = response.data[0];

    return {
      year,
      sphere,
      category,
      budgeted: parseFloat(data.valor_orcado || 0),
      executed: parseFloat(data.valor_executado || 0),
      percentage: calculateExecutionRate(
        parseFloat(data.valor_orcado || 0),
        parseFloat(data.valor_executado || 0)
      ),
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`[SICONFI] Erro ao buscar dados: ${error}`);
    return null;
  }
}

/**
 * Buscar histórico de execução orçamentária
 */
export async function getBudgetHistory(
  category: string,
  startYear: number,
  endYear: number,
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'
): Promise<BudgetComparison[]> {
  try {
    logger.info(`[SICONFI] Buscando histórico: ${category} (${startYear}-${endYear})`);

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
  } catch (error) {
    logger.error(`[SICONFI] Erro ao buscar histórico: ${error}`);
    return [];
  }
}

/**
 * Calcular taxa de execução orçamentária
 */
export function calculateExecutionRate(budgeted: number, executed: number): number {
  if (budgeted === 0) return 0;
  return Math.min((executed / budgeted) * 100, 100);
}

/**
 * Validar se uma promessa é viável orçamentariamente
 * Compara valor estimado com histórico de execução
 */
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
  try {
    // Buscar histórico dos últimos 5 anos
    const currentYear = new Date().getFullYear();
    const history = await getBudgetHistory(
      category,
      Math.max(currentYear - 5, 2015),
      currentYear,
      sphere
    );

    if (history.length === 0) {
      return {
        viable: true,
        confidence: 0.3,
        reason: 'Sem dados históricos disponíveis',
        historicalData: [],
      };
    }

    // Calcular média de execução histórica
    const avgExecutionRate =
      history.reduce((sum, h) => sum + h.executionRate, 0) / history.length;

    // Calcular variância
    const variance =
      history.reduce((sum, h) => sum + Math.pow(h.executionRate - avgExecutionRate, 2), 0) /
      history.length;
    const stdDev = Math.sqrt(variance);

    // Validar viabilidade
    const isViable = estimatedValue > 0 && avgExecutionRate > 50;
    const confidence = Math.max(0, Math.min(1, avgExecutionRate / 100 - stdDev / 100));

    return {
      viable: isViable,
      confidence,
      reason: `Taxa média de execução: ${avgExecutionRate.toFixed(1)}% (±${stdDev.toFixed(1)}%)`,
      historicalData: history,
    };
  } catch (error) {
    logger.error(`[SICONFI] Erro ao validar viabilidade: ${error}`);
    return {
      viable: false,
      confidence: 0,
      reason: 'Erro ao validar dados orçamentários',
      historicalData: [],
    };
  }
}

/**
 * Mapear categorias de promessas para categorias SICONFI
 */
export function mapPromiseToSiconfiCategory(promiseCategory: string): string {
  const mapping: Record<string, string> = {
    EDUCATION: 'EDUCACAO',
    HEALTH: 'SAUDE',
    INFRASTRUCTURE: 'INFRAESTRUTURA',
    EMPLOYMENT: 'EMPREGO',
    ECONOMY: 'ECONOMIA',
    SECURITY: 'SEGURANCA',
    ENVIRONMENT: 'MEIO_AMBIENTE',
    SOCIAL: 'ASSISTENCIA_SOCIAL',
    AGRICULTURE: 'AGRICULTURA',
    TRANSPORT: 'TRANSPORTES',
  };

  return mapping[promiseCategory] || 'GERAL';
}

/**
 * Sincronizar dados do SICONFI com banco local (cache)
 * Deve ser executado periodicamente (ex: diariamente)
 */
export async function syncSiconfiData(categories: string[]): Promise<void> {
  try {
    logger.info('[SICONFI] Iniciando sincronização de dados');

    const currentYear = new Date().getFullYear();

    for (const category of categories) {
      for (let year = currentYear - 3; year <= currentYear; year++) {
        for (const sphere of ['FEDERAL', 'STATE', 'MUNICIPAL'] as const) {
          const data = await getBudgetData(category, year, sphere);

          if (data) {
            // Em produção, salvar no banco de dados
            logger.debug(`[SICONFI] Sincronizado: ${category} ${year} ${sphere}`);
          }
        }
      }
    }

    logger.info('[SICONFI] Sincronização concluída');
  } catch (error) {
    logger.error(`[SICONFI] Erro durante sincronização: ${error}`);
  }
}
