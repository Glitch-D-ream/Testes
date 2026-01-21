/**
 * Integração com TSE (Tribunal Superior Eleitoral)
 * Fornece dados sobre candidatos, histórico de promessas e desempenho político
 * 
 * API: https://www.tse.jus.br/eleitor/glossario/termos/api-de-dados-abertos
 * Dados: Candidatos, eleições, resultados, propostas
 */

import axios from 'axios';
import logger from '../core/logger.js';

const TSE_API_BASE = 'https://www.tse.jus.br/eleitor/api';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  position: string; // prefeito, vereador, governador, senador, deputado
  state: string;
  city?: string;
  electionYear: number;
  votes: number;
  elected: boolean;
}

export interface HistoricalPromise {
  candidateId: string;
  candidateName: string;
  electionYear: number;
  promise: string;
  category: string;
  fulfilled: boolean;
  partiallyFulfilled: boolean;
  source: string;
}

export interface PoliticalHistory {
  candidateId: string;
  candidateName: string;
  totalElections: number;
  totalElected: number;
  electionRate: number;
  promisesFulfilled: number;
  promisesTotal: number;
  fulfillmentRate: number;
  controversies: number;
  scandals: number;
}

/**
 * Buscar informações de um candidato
 */
export async function getCandidateInfo(candidateName: string, state: string): Promise<Candidate | null> {
  try {
    logger.info(`[TSE] Buscando candidato: ${candidateName} (${state})`);

    const response = await axios.get(`${TSE_API_BASE}/candidatos`, {
      params: {
        nome: candidateName,
        uf: state,
      },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      logger.warn(`[TSE] Candidato não encontrado: ${candidateName}`);
      return null;
    }

    const data = response.data[0];

    return {
      id: data.id,
      name: data.nome,
      party: data.partido,
      position: data.cargo,
      state: data.uf,
      city: data.municipio,
      electionYear: parseInt(data.ano_eleicao),
      votes: parseInt(data.votos || 0),
      elected: data.eleito === 'S',
    };
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar candidato: ${error}`);
    return null;
  }
}

/**
 * Buscar histórico de promessas de um candidato
 */
export async function getCandidatePromiseHistory(
  candidateId: string,
  candidateName: string
): Promise<HistoricalPromise[]> {
  try {
    logger.info(`[TSE] Buscando histórico de promessas: ${candidateName}`);

    const response = await axios.get(`${TSE_API_BASE}/promessas`, {
      params: {
        candidato_id: candidateId,
      },
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      logger.warn(`[TSE] Nenhuma promessa encontrada para ${candidateName}`);
      return [];
    }

    return response.data.map((item: any) => ({
      candidateId,
      candidateName,
      electionYear: parseInt(item.ano_eleicao),
      promise: item.promessa,
      category: item.categoria,
      fulfilled: item.cumprida === 'S',
      partiallyFulfilled: item.parcialmente_cumprida === 'S',
      source: item.fonte,
    }));
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar histórico: ${error}`);
    return [];
  }
}

/**
 * Calcular histórico político de um candidato
 */
export async function getPoliticalHistory(
  candidateName: string,
  state: string
): Promise<PoliticalHistory | null> {
  try {
    logger.info(`[TSE] Calculando histórico político: ${candidateName}`);

    // Buscar candidato
    const candidate = await getCandidateInfo(candidateName, state);

    if (!candidate) {
      return null;
    }

    // Buscar histórico de promessas
    const promises = await getCandidatePromiseHistory(candidate.id, candidateName);

    // Buscar histórico de eleições (últimas 5)
    const elections = await getCandidateElectionHistory(candidate.id);

    // Calcular métricas
    const totalElected = elections.filter((e) => e.elected).length;
    const electionRate = elections.length > 0 ? (totalElected / elections.length) * 100 : 0;

    const promisesFulfilled = promises.filter((p) => p.fulfilled).length;
    const promisesPartial = promises.filter((p) => p.partiallyFulfilled).length;
    const fulfillmentRate =
      promises.length > 0
        ? ((promisesFulfilled + promisesPartial * 0.5) / promises.length) * 100
        : 0;

    // Buscar controvérsias e escândalos (simulado)
    const controversies = await getControversies(candidateName);
    const scandals = await getScandalCount(candidateName);

    return {
      candidateId: candidate.id,
      candidateName,
      totalElections: elections.length,
      totalElected,
      electionRate,
      promisesFulfilled,
      promisesTotal: promises.length,
      fulfillmentRate,
      controversies,
      scandals,
    };
  } catch (error) {
    logger.error(`[TSE] Erro ao calcular histórico: ${error}`);
    return null;
  }
}

/**
 * Buscar histórico de eleições de um candidato
 */
async function getCandidateElectionHistory(candidateId: string): Promise<Candidate[]> {
  try {
    const response = await axios.get(`${TSE_API_BASE}/candidatos/${candidateId}/eleicoes`, {
      timeout: 10000,
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((item: any) => ({
      id: item.id,
      name: item.nome,
      party: item.partido,
      position: item.cargo,
      state: item.uf,
      city: item.municipio,
      electionYear: parseInt(item.ano_eleicao),
      votes: parseInt(item.votos || 0),
      elected: item.eleito === 'S',
    }));
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar histórico de eleições: ${error}`);
    return [];
  }
}

/**
 * Buscar controvérsias de um candidato
 */
async function getControversies(candidateName: string): Promise<number> {
  try {
    const response = await axios.get(`${TSE_API_BASE}/controversias`, {
      params: {
        candidato: candidateName,
      },
      timeout: 10000,
    });

    return response.data?.length || 0;
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar controvérsias: ${error}`);
    return 0;
  }
}

/**
 * Buscar número de escândalos
 */
async function getScandalCount(candidateName: string): Promise<number> {
  try {
    const response = await axios.get(`${TSE_API_BASE}/scandals`, {
      params: {
        candidato: candidateName,
      },
      timeout: 10000,
    });

    return response.data?.length || 0;
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar escândalos: ${error}`);
    return 0;
  }
}

/**
 * Validar credibilidade de um candidato baseado em histórico
 */
export async function validateCandidateCredibility(
  candidateName: string,
  state: string
): Promise<{
  credible: boolean;
  score: number;
  reason: string;
  history: PoliticalHistory | null;
}> {
  try {
    const history = await getPoliticalHistory(candidateName, state);

    if (!history) {
      return {
        credible: true,
        score: 0.5,
        reason: 'Sem histórico político disponível',
        history: null,
      };
    }

    // Calcular score de credibilidade (0-1)
    let credibilityScore = 0.5; // Base

    // Fator 1: Taxa de eleição (0.2)
    credibilityScore += (history.electionRate / 100) * 0.2;

    // Fator 2: Taxa de cumprimento de promessas (0.3)
    credibilityScore += (history.fulfillmentRate / 100) * 0.3;

    // Fator 3: Ausência de escândalos (-0.2 por escândalo)
    credibilityScore -= Math.min(history.scandals * 0.05, 0.2);

    // Fator 4: Ausência de controvérsias (-0.1 por controvérsia)
    credibilityScore -= Math.min(history.controversies * 0.02, 0.1);

    // Normalizar score entre 0 e 1
    credibilityScore = Math.max(0, Math.min(1, credibilityScore));

    const credible = credibilityScore > 0.5;

    let reason = '';
    if (history.fulfillmentRate > 70) {
      reason = `Histórico de cumprimento de promessas acima de 70% (${history.fulfillmentRate.toFixed(1)}%)`;
    } else if (history.fulfillmentRate > 50) {
      reason = `Histórico moderado de cumprimento (${history.fulfillmentRate.toFixed(1)}%)`;
    } else if (history.fulfillmentRate > 0) {
      reason = `Histórico baixo de cumprimento (${history.fulfillmentRate.toFixed(1)}%)`;
    } else {
      reason = 'Sem promessas anteriores registradas';
    }

    if (history.scandals > 0) {
      reason += ` | ${history.scandals} escândalo(s) registrado(s)`;
    }

    return {
      credible,
      score: credibilityScore,
      reason,
      history,
    };
  } catch (error) {
    logger.error(`[TSE] Erro ao validar credibilidade: ${error}`);
    return {
      credible: false,
      score: 0,
      reason: 'Erro ao validar dados históricos',
      history: null,
    };
  }
}

/**
 * Sincronizar dados do TSE com banco local (cache)
 */
export async function syncTSEData(candidates: Array<{ name: string; state: string }>): Promise<void> {
  try {
    logger.info('[TSE] Iniciando sincronização de dados');

    for (const candidate of candidates) {
      const history = await getPoliticalHistory(candidate.name, candidate.state);

      if (history) {
        logger.debug(`[TSE] Sincronizado: ${candidate.name} (${candidate.state})`);
        // Em produção, salvar no banco de dados
      }
    }

    logger.info('[TSE] Sincronização concluída');
  } catch (error) {
    logger.error(`[TSE] Erro durante sincronização: ${error}`);
  }
}
