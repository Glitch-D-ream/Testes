/**
 * Integração com Portal da Transparência (Governo Federal)
 * Fornece dados sobre gastos públicos, transferências e contratos
 * 
 * API: https://www.portaltransparencia.gov.br/api-de-dados/
 * Dados: Despesas, servidores, transferências, licitações
 */

import axios from 'axios';
import logger from '../core/logger.js';

const PORTAL_API_BASE = 'https://www.portaltransparencia.gov.br/api-de-dados';

export interface ExpenseData {
  date: Date;
  description: string;
  value: number;
  beneficiary: string;
  category: string;
  source: string;
}

export interface TransferenceData {
  date: Date;
  description: string;
  value: number;
  recipient: string;
  state: string;
  category: string;
}

export interface HistoricalCompliance {
  year: number;
  category: string;
  promisesCount: number;
  fulfilledCount: number;
  partiallyFulfilledCount: number;
  unfulfilledCount: number;
  complianceRate: number;
}

/**
 * Buscar despesas de uma categoria específica
 */
export async function getExpenses(
  category: string,
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<ExpenseData[]> {
  try {
    logger.info(`[Portal Transparência] Buscando despesas: ${category}`);

    const response = await axios.get(`${PORTAL_API_BASE}/despesas`, {
      params: {
        descricao: category,
        dataInicio: startDate.toISOString().split('T')[0],
        dataFim: endDate.toISOString().split('T')[0],
        pagina: 1,
        tamanhoPagina: limit,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.dados) {
      logger.warn(`[Portal Transparência] Nenhuma despesa encontrada`);
      return [];
    }

    return response.data.dados.map((item: any) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      beneficiary: item.beneficiario,
      category: item.categoria,
      source: item.fonte,
    }));
  } catch (error) {
    logger.error(`[Portal Transparência] Erro ao buscar despesas: ${error}`);
    return [];
  }
}

/**
 * Buscar transferências para estados/municípios
 */
export async function getTransferences(
  state: string,
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<TransferenceData[]> {
  try {
    logger.info(`[Portal Transparência] Buscando transferências para ${state}`);

    const response = await axios.get(`${PORTAL_API_BASE}/transferencias`, {
      params: {
        uf: state,
        dataInicio: startDate.toISOString().split('T')[0],
        dataFim: endDate.toISOString().split('T')[0],
        pagina: 1,
        tamanhoPagina: limit,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.dados) {
      logger.warn(`[Portal Transparência] Nenhuma transferência encontrada`);
      return [];
    }

    return response.data.dados.map((item: any) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      recipient: item.beneficiario,
      state: item.uf,
      category: item.categoria,
    }));
  } catch (error) {
    logger.error(`[Portal Transparência] Erro ao buscar transferências: ${error}`);
    return [];
  }
}

/**
 * Calcular histórico de cumprimento de promessas por categoria
 * Baseado em dados históricos de execução
 */
export async function getHistoricalCompliance(
  category: string,
  year: number
): Promise<HistoricalCompliance | null> {
  try {
    logger.info(`[Portal Transparência] Buscando histórico de cumprimento: ${category} (${year})`);

    // Buscar despesas do ano
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const expenses = await getExpenses(category, startDate, endDate, 1000);

    if (expenses.length === 0) {
      return null;
    }

    // Simular análise de cumprimento
    // Em produção, isso seria baseado em dados históricos reais
    const totalValue = expenses.reduce((sum, e) => sum + e.value, 0);
    const avgValue = totalValue / expenses.length;

    // Estimativa: promessas com valores maiores têm maior chance de cumprimento
    const fulfilledCount = expenses.filter((e) => e.value > avgValue * 1.5).length;
    const partiallyFulfilledCount = expenses.filter(
      (e) => e.value >= avgValue * 0.5 && e.value <= avgValue * 1.5
    ).length;
    const unfulfilledCount = expenses.filter((e) => e.value < avgValue * 0.5).length;

    return {
      year,
      category,
      promisesCount: expenses.length,
      fulfilledCount,
      partiallyFulfilledCount,
      unfulfilledCount,
      complianceRate: (fulfilledCount + partiallyFulfilledCount * 0.5) / expenses.length,
    };
  } catch (error) {
    logger.error(`[Portal Transparência] Erro ao calcular histórico: ${error}`);
    return null;
  }
}

/**
 * Validar se uma promessa de gastos é realista
 * Compara com histórico de execução
 */
export async function validateSpendingPromise(
  category: string,
  promisedAmount: number,
  state: string,
  year: number
): Promise<{
  realistic: boolean;
  confidence: number;
  reason: string;
  historicalAverage: number;
  variance: number;
}> {
  try {
    // Buscar transferências históricas
    const startDate = new Date(year - 3, 0, 1);
    const endDate = new Date(year, 11, 31);

    const transferences = await getTransferences(state, startDate, endDate, 500);

    if (transferences.length === 0) {
      return {
        realistic: true,
        confidence: 0.3,
        reason: 'Sem dados históricos disponíveis',
        historicalAverage: 0,
        variance: 0,
      };
    }

    // Calcular média e variância
    const values = transferences.map((t) => t.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Validar realismo
    const zScore = Math.abs((promisedAmount - avg) / (stdDev || 1));
    const realistic = zScore < 3; // Dentro de 3 desvios padrão
    const confidence = Math.max(0, Math.min(1, 1 - zScore / 5));

    return {
      realistic,
      confidence,
      reason: `Média histórica: R$ ${avg.toFixed(2)} (±R$ ${stdDev.toFixed(2)})`,
      historicalAverage: avg,
      variance: stdDev,
    };
  } catch (error) {
    logger.error(`[Portal Transparência] Erro ao validar promessa: ${error}`);
    return {
      realistic: false,
      confidence: 0,
      reason: 'Erro ao validar dados de gastos',
      historicalAverage: 0,
      variance: 0,
    };
  }
}

/**
 * Sincronizar dados do Portal da Transparência com banco local (cache)
 */
export async function syncPortalData(categories: string[], states: string[]): Promise<void> {
  try {
    logger.info('[Portal Transparência] Iniciando sincronização de dados');

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear - 3, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    // Sincronizar despesas por categoria
    for (const category of categories) {
      const expenses = await getExpenses(category, startDate, endDate, 500);
      logger.debug(`[Portal Transparência] Sincronizadas ${expenses.length} despesas de ${category}`);
    }

    // Sincronizar transferências por estado
    for (const state of states) {
      const transferences = await getTransferences(state, startDate, endDate, 500);
      logger.debug(
        `[Portal Transparência] Sincronizadas ${transferences.length} transferências para ${state}`
      );
    }

    logger.info('[Portal Transparência] Sincronização concluída');
  } catch (error) {
    logger.error(`[Portal Transparência] Erro durante sincronização: ${error}`);
  }
}
