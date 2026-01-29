/**
 * Integração com TSE (Tribunal Superior Eleitoral)
 * ATUALIZADO: Busca multi-ano para histórico completo
 */
import axios from 'axios';
import logger from '../core/logger.ts';
import { savePublicDataCache, getPublicDataCache } from '../core/database.ts';

const TSE_API_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  position: string;
  state: string;
  city?: string;
  electionYear: number;
  votes: number;
  elected: boolean;
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
 * Buscar histórico político de um candidato em múltiplos anos
 */
export async function getPoliticalHistory(candidateName: string, state: string): Promise<PoliticalHistory | null> {
  try {
    const cacheKey = `history_v3_${candidateName}_${state}`;
    const cached = await getPublicDataCache('TSE', cacheKey);
    if (cached) return cached;

    logger.info(`[TSE] Buscando histórico multi-ano: ${candidateName}`);

    // Anos eleitorais para buscar e seus códigos de eleição correspondentes
    const electionConfigs = [
      { year: 2024, code: '2045202024' },
      { year: 2022, code: '2040602022' },
      { year: 2020, code: '2030402020' }
    ];

    let totalElections = 0;
    let totalElected = 0;
    let mainCandidateData: any = null;

    for (const config of electionConfigs) {
      try {
        // A URL correta do TSE exige o código da eleição
        const url = `${TSE_API_BASE}/eleicao/buscar/${state}/${config.code}/candidatos`;
        const searchResponse = await axios.get(url, {
          params: { nome: candidateName },
          timeout: 7000
        }).catch(() => null);

        if (searchResponse?.data?.candidatos?.length > 0) {
          const cand = searchResponse.data.candidatos[0];
          totalElections++;
          if (cand.descricaoTotalizacao === 'Eleito' || cand.descricaoTotalizacao === 'Eleito por QP' || cand.descricaoTotalizacao === 'Eleito por média') {
            totalElected++;
          }
          if (!mainCandidateData) mainCandidateData = cand;
        }
      } catch (e) {
        continue;
      }
    }

    if (mainCandidateData) {
      const history: PoliticalHistory = {
        candidateId: mainCandidateData.id.toString(),
        candidateName: mainCandidateData.nomeCompleto,
        totalElections: totalElections,
        totalElected: totalElected,
        electionRate: totalElections > 0 ? Math.round((totalElected / totalElections) * 100) : 0,
        promisesFulfilled: 0,
        promisesTotal: 0,
        fulfillmentRate: 50,
        controversies: 0,
        scandals: 0
      };
      
      await savePublicDataCache('TSE', cacheKey, history);
      return history;
    }

    logger.warn(`[TSE] Nenhum dado encontrado em 2024, 2022 ou 2020 para: ${candidateName}.`);
    return null;
  } catch (error) {
    logger.error(`[TSE] Erro ao buscar histórico: ${error}`);
    return null;
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
  const history = await getPoliticalHistory(candidateName, state);
  if (!history) {
    return { credible: true, score: 0.5, reason: 'Sem histórico político disponível nos ciclos 2020-2024', history: null };
  }

  let score = 0.5;
  score += (history.fulfillmentRate / 100) * 0.3;
  score += (history.electionRate / 100) * 0.2;
  score -= (history.scandals * 0.1);
  
  score = Math.max(0, Math.min(1, score));

  return {
    credible: score > 0.4,
    score,
    reason: `Histórico: ${history.totalElections} eleições, ${history.totalElected} vitórias. Taxa de eleição: ${history.electionRate}%`,
    history
  };
}

export async function syncTSEData(candidates: Array<{ name: string; state: string }>): Promise<void> {
  logger.info('[TSE] Iniciando sincronização');
  for (const candidate of candidates) {
    await getPoliticalHistory(candidate.name, candidate.state);
  }
  logger.info('[TSE] Sincronização concluída');
}
