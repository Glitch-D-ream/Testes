/**
 * Integração com a API do IBGE (Instituto Brasileiro de Geografia e Estatística)
 * Fornece dados socioeconômicos para contexto de viabilidade
 */
import axios from 'axios';
import logger from '../core/logger.ts';
import { savePublicDataCache, getPublicDataCache } from '../core/database.ts';

const IBGE_API_BASE = 'https://servicodados.ibge.gov.br/api/v3';

export interface SocioEconomicData {
  population: number;
  pib: number;
  pibPerCapita: number;
  lastUpdated: string;
}

/**
 * Busca dados socioeconômicos básicos do Brasil (Nacional)
 */
export async function getNationalSocioEconomicData(): Promise<SocioEconomicData | null> {
  try {
    const cacheKey = 'national_socioeconomic_v1';
    const cached = await getPublicDataCache('IBGE', cacheKey);
    if (cached) return cached;

    logger.info('[IBGE] Buscando dados socioeconômicos nacionais...');

    // 1. Buscar População (Estimativa mais recente)
    const popRes = await axios.get(`${IBGE_API_BASE}/agregados/6579/periodos/-6/variaveis/93?localidades=N1[all]`);
    const population = parseInt(popRes.data[0].resumos[0].valor);

    // 2. Buscar PIB (Série histórica mais recente)
    const pibRes = await axios.get(`${IBGE_API_BASE}/agregados/5938/periodos/-1/variaveis/37?localidades=N1[all]`);
    const pib = parseFloat(pibRes.data[0].resumos[0].valor) * 1000000; // Valor em Milhões no IBGE

    const data: SocioEconomicData = {
      population,
      pib,
      pibPerCapita: pib / population,
      lastUpdated: new Date().toISOString()
    };

    await savePublicDataCache('IBGE', cacheKey, data);
    return data;
  } catch (error) {
    logger.error(`[IBGE] Erro ao buscar dados: ${error}`);
    // Fallback para dados aproximados de 2024/2025
    return {
      population: 215000000,
      pib: 10000000000000, // ~10 Trilhões
      pibPerCapita: 46500,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Valida se um valor de promessa é "razoável" frente ao PIB nacional
 */
export async function validateValueAgainstPIB(estimatedValue: number): Promise<{
  percentageOfPIB: number;
  isReasonable: boolean;
  context: string;
}> {
  const data = await getNationalSocioEconomicData();
  if (!data) return { percentageOfPIB: 0, isReasonable: true, context: 'Dados do IBGE indisponíveis' };

  const percentage = (estimatedValue / data.pib) * 100;
  const isReasonable = percentage < 1.0; // Critério: Uma única promessa não deve custar mais de 1% do PIB nacional

  return {
    percentageOfPIB: percentage,
    isReasonable,
    context: `O valor estimado representa ${percentage.toFixed(4)}% do PIB Nacional (${(data.pib / 1e12).toFixed(2)} Trilhões).`
  };
}
