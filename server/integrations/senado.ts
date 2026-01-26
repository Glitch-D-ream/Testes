/**
 * Integração com a API do Senado Federal
 * Documentação: https://www12.senado.leg.br/dados-abertos/docs/ui-v2/
 */
import axios from 'axios';
import logger from '../core/logger.ts';
import { savePublicDataCache, getPublicDataCache } from '../core/database.ts';

const SENADO_API_BASE = 'https://legis.senado.leg.br/dadosabertos/senador';

export interface SenadoVote {
  codigoSessao: string;
  data: string;
  siglaMateria: string;
  numeroMateria: string;
  anoMateria: string;
  voto: string;
  ementa: string;
}

/**
 * Busca o código de um senador pelo nome
 */
export async function getSenadorCodigo(nome: string): Promise<number | null> {
  try {
    const cacheKey = `senador_codigo_${nome}`;
    const cached = await getPublicDataCache(cacheKey, 'SENADO');
    if (cached) return cached.codigo;

    const response = await axios.get(`${SENADO_API_BASE}/lista/atual`, {
      headers: { 'Accept': 'application/json' }
    });

    const senadores = response.data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
    const senador = senadores.find((s: any) => s.IdentificacaoParlamentar.NomeParlamentar.toLowerCase().includes(nome.toLowerCase()));
    
    if (senador) {
      const codigo = senador.IdentificacaoParlamentar.CodigoParlamentar;
      await savePublicDataCache(cacheKey, 'SENADO', { codigo });
      return codigo;
    }
    return null;
  } catch (error) {
    logger.error(`[Senado] Erro ao buscar código do senador ${nome}: ${error}`);
    return null;
  }
}

/**
 * Busca votações recentes de um senador
 */
export async function getVotacoesSenador(codigoSenador: number): Promise<SenadoVote[]> {
  try {
    const cacheKey = `votacoes_senado_${codigoSenador}`;
    const cached = await getPublicDataCache(cacheKey, 'SENADO');
    if (cached) return cached;

    const response = await axios.get(`${SENADO_API_BASE}/${codigoSenador}/votacoes`, {
      headers: { 'Accept': 'application/json' }
    });

    const votacoesRaw = response.data.VotacaoParlamentar.Parlamentar.Votacoes.Votacao;
    const votacoes = votacoesRaw.map((v: any) => ({
      codigoSessao: v.CodigoSessao,
      data: v.DataSessao,
      siglaMateria: v.Materia.Sigla,
      numeroMateria: v.Materia.Numero,
      anoMateria: v.Materia.Ano,
      voto: v.DescricaoVoto,
      ementa: v.Materia.Ementa || 'Sem ementa disponível'
    }));

    await savePublicDataCache(cacheKey, 'SENADO', votacoes);
    return votacoes;
  } catch (error) {
    logger.error(`[Senado] Erro ao buscar votações do senador ${codigoSenador}: ${error}`);
    return [];
  }
}

/**
 * Busca matérias (projetos de lei) de um senador
 */
export async function getMateriasSenador(codigoSenador: number): Promise<any[]> {
  try {
    const cacheKey = `materias_senado_${codigoSenador}`;
    const cached = await getPublicDataCache(cacheKey, 'SENADO');
    if (cached) return cached;

    const response = await axios.get(`${SENADO_API_BASE}/materia/autor/${codigoSenador}`, {
      headers: { 'Accept': 'application/json' }
    });

    const materiasRaw = response.data.ListaMateriasAutoria.Materias.Materia;
    const materias = (Array.isArray(materiasRaw) ? materiasRaw : [materiasRaw]).slice(0, 10).map((m: any) => ({
      id: m.CodigoMateria,
      sigla: m.SiglaMateria,
      numero: m.NumeroMateria,
      ano: m.AnoMateria,
      ementa: m.EmentaMateria || 'Sem ementa disponível',
      url: `https://www25.senado.leg.br/web/atividade/materias/-/materia/${m.CodigoMateria}`
    }));

    await savePublicDataCache(cacheKey, 'SENADO', materias);
    return materias;
  } catch (error) {
    logger.error(`[Senado] Erro ao buscar matérias do senador ${codigoSenador}: ${error}`);
    return [];
  }
}
