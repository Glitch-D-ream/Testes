/**
 * Integração com Portal da Transparência (Governo Federal)
 */

import axios from 'axios';
import logger from '../core/logger.js';
import { savePublicDataCache, getPublicDataCache } from '../core/database.js';

const PORTAL_API_BASE = 'https://www.portaltransparencia.gov.br/api-de-dados';

export interface ExpenseData {
  date: Date;
  description: string;
  value: number;
  beneficiary: string;
  category: string;
  source: string;
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
    const cacheKey = `expenses_${category}_${startDate.getFullYear()}`;
    const cached = await getPublicDataCache('PORTAL_TRANSPARENCIA', cacheKey);
    if (cached) return cached;

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
    }).catch(() => ({ data: null }));

    if (!response.data || !response.data.dados) {
      logger.warn(`[Portal Transparência] Falha na API ou dados inexistentes para: ${category}`);
      return [];
    }

    const result = response.data.dados.map((item: any) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      beneficiary: item.beneficiario,
      category: item.categoria,
      source: item.fonte,
    }));

    await savePublicDataCache('PORTAL_TRANSPARENCIA', cacheKey, result);
    return result;
  } catch (error) {
    logger.error(`[Portal Transparência] Erro ao buscar despesas: ${error}`);
    return [];
  }
}

export async function syncPortalData(categories: string[], states: string[]): Promise<void> {
  logger.info('[Portal Transparência] Iniciando sincronização');
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date();
  
  for (const category of categories) {
    await getExpenses(category, startDate, endDate);
  }
  logger.info('[Portal Transparência] Sincronização concluída');
}
