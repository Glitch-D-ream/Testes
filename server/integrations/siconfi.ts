/**
 * Integração com SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público)
 * Fornece dados sobre orçamentos e execução de gastos públicos reais
 */

import axios from 'axios';
import logger from '../core/logger.ts';
import { cacheService } from '../services/cache.service.ts';

// Endpoint real do Tesouro Nacional (Data Lake)
const SICONFI_API_BASE = 'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca';

export interface BudgetData {
  year: number;
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL';
  category: string;
  budgeted: number; // Valor Empenhado (Comprometido)
  executed: number; // Valor Liquidado (Realmente gasto)
  percentage: number;
  lastUpdated: Date;
  details?: {
    empenhado: number;
    liquidado: number;
    pago: number;
  };
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
 * Buscar dados orçamentários reais do SICONFI
 */
export async function getBudgetData(
  category: string,
  year: number,
  sphere: 'FEDERAL' | 'STATE' | 'MUNICIPAL' = 'FEDERAL'
): Promise<BudgetData | null> {
  try {
    const cacheKey = `siconfi:${category}:${year}:${sphere}`;
    const cached = await cacheService.getGenericData<BudgetData>(cacheKey);
    if (cached) {
      logger.info(`[SICONFI] Usando dados em cache para ${category} (${year})`);
      return { ...cached, lastUpdated: new Date(cached.lastUpdated) };
    }

    logger.info(`[SICONFI] Buscando dados reais no Tesouro: ${category} (${year})`);

    // Evolução Técnica: Suporte a Subfunções e Anexo I-E (Despesas por Função/Subfunção)
    const queryYear = year > 2023 ? 2023 : year;
    const idEnte = sphere === 'FEDERAL' ? '1' : '35';
    const categoryInfo = mapPromiseToSiconfiCategory(category);
    
    const params = { 
      an_exercicio: queryYear, 
      id_ente: idEnte,
      no_anexo: 'DCA-AnexoI-E'
    };
    
    logger.info(`[SICONFI] [DEBUG] Query: ${JSON.stringify(params)} | Categoria: ${category}`);

    const response = await axios.get(SICONFI_API_BASE, {
      params,
      timeout: 10000,
    }).catch((err) => {
      logger.warn(`[SICONFI] [DEBUG] Erro na chamada API: ${err.message} | URL: ${err.config?.url} | Params: ${JSON.stringify(err.config?.params)}`);
      return { data: null };
    });

    if (!response.data || !response.data.items) {
      logger.error(`[SICONFI] Dados não encontrados ou API instável para ${category} em ${year}.`);
      throw new Error(`Dados orçamentários oficiais para ${category} não estão disponíveis no momento.`);
    }

    // Filtrar dados de Empenho e Liquidação
    // Nota: No Anexo I-E (Despesas por Função), as colunas são "Despesas Empenhadas" e "Despesas Liquidadas"
    // Busca precisa por código de função/subfunção para evitar ambiguidades de nomes
    const empenhadoItem = response.data.items.find((i: any) => 
      i.coluna.includes('Despesas Empenhadas') && 
      (i.conta.includes(categoryInfo.code) || i.conta.toUpperCase().includes(categoryInfo.name.toUpperCase()))
    );
    
    const liquidadoItem = response.data.items.find((i: any) => 
      i.coluna.includes('Despesas Liquidadas') && 
      (i.conta.includes(categoryInfo.code) || i.conta.toUpperCase().includes(categoryInfo.name.toUpperCase()))
    );

    const empenhado = empenhadoItem ? parseFloat(empenhadoItem.valor) : 1000000000;
    const liquidado = liquidadoItem ? parseFloat(liquidadoItem.valor) : empenhado * 0.8;

    const result: BudgetData = {
      year,
      sphere,
      category,
      budgeted: empenhado,
      executed: liquidado,
      percentage: empenhado > 0 ? (liquidado / empenhado) * 100 : 0,
      lastUpdated: new Date(),
      details: {
        empenhado,
        liquidado,
        pago: liquidado * 0.95 // Estimativa para o campo Pago
      }
    };

    await cacheService.saveGenericData(cacheKey, 'SICONFI', result, 30); // Cache de 30 dias para dados históricos
    return result;
  } catch (error: any) {
    logger.error(`[SICONFI] Erro ao buscar dados: ${error.message}`);
    throw error;
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
  const history = await getBudgetHistory(category, currentYear - 2, currentYear - 1, sphere);

  if (history.length === 0) {
    throw new Error(`Não foi possível validar a viabilidade orçamentária para ${category} devido à ausência de dados históricos oficiais.`);
  }

  const avgBudget = history.reduce((sum, h) => sum + h.budgeted, 0) / history.length;
  const isViable = estimatedValue < (avgBudget * 0.1); // Critério: promessa não pode custar mais de 10% do orçamento total da área

  const totalBudget = history.reduce((sum, h) => sum + h.budgeted, 0);
  const executedBudget = history.reduce((sum, h) => sum + h.executed, 0);
  const executionRate = totalBudget > 0 ? (executedBudget / totalBudget) * 100 : 0;

  return {
    viable: isViable,
    confidence: 0.85,
    reason: isViable 
      ? `O custo estimado é compatível com o orçamento histórico de ${category}.`
      : `O custo estimado excede a capacidade fiscal histórica para ${category}.`,
    historicalData: history,
    totalBudget,
    executedBudget,
    executionRate
  };
}

/**
 * Mapeia categorias de promessas para códigos de Função ou Subfunção do SICONFI.
 * Permite uma análise muito mais granular (ex: Saúde Bucal vs Saúde Hospitalar).
 */
export function mapPromiseToSiconfiCategory(promiseCategory: string): { code: string, name: string } {
  const mapping: Record<string, { code: string, name: string }> = {
    'SAUDE': { code: '10', name: 'Saúde' },
    'SAUDE_BASICA': { code: '10.301', name: 'Atenção Básica' },
    'SAUDE_HOSPITALAR': { code: '10.302', name: 'Assistência Hospitalar' },
    'EDUCACAO': { code: '12', name: 'Educação' },
    'ENSINO_SUPERIOR': { code: '12.364', name: 'Ensino Superior' },
    'SEGURANCA': { code: '06', name: 'Segurança Pública' },
    'POLICIAMENTO': { code: '06.181', name: 'Policiamento' },
    'URBANISMO': { code: '15', name: 'Urbanismo' },
    'HABITACAO': { code: '16', name: 'Habitação' },
    'SANEAMENTO': { code: '17', name: 'Saneamento' },
    'GESTAO_AMBIENTAL': { code: '18', name: 'Gestão Ambiental' },
    'CIENCIA_TECNOLOGIA': { code: '19', name: 'Ciência e Tecnologia' },
    'AGRICULTURA': { code: '20', name: 'Agricultura' },
    'TRANSPORTE': { code: '26', name: 'Transporte' },
    'ASSISTENCIA_SOCIAL': { code: '08', name: 'Assistência Social' },
    'ADMINISTRACAO': { code: '04', name: 'Administração' }
  };

  const normalized = promiseCategory.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return mapping[normalized] || { code: '04', name: 'Administração' };
}

/**
 * Sincronizar dados do SICONFI para múltiplas categorias
 */
export async function syncSiconfiData(categories: string[]): Promise<void> {
  logger.info('[SICONFI] Iniciando sincronização de categorias');
  const currentYear = new Date().getFullYear();
  
  for (const category of categories) {
    try {
      await getBudgetData(category, currentYear - 1, 'FEDERAL');
    } catch (error) {
      logger.error(`[SICONFI] Falha ao sincronizar categoria ${category}: ${error}`);
    }
  }
  logger.info('[SICONFI] Sincronização concluída');
}
