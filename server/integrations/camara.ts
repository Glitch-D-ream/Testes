/**
 * Integração com a API da Câmara dos Deputados
 * Documentação: https://dadosabertos.camara.leg.br/swagger/recursos.html
 */
import axios from 'axios';
import logger from '../core/logger.ts';
import { savePublicDataCache, getPublicDataCache } from '../core/database.ts';

const CAMARA_API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

export interface Vote {
  idVotacao: string;
  data: string;
  proposicao: string;
  voto: string;
  ementa: string;
  incoerencia?: boolean;
  justificativa?: string;
}

/**
 * Busca o ID de um deputado pelo nome
 */
export async function getDeputadoId(nome: string): Promise<number | null> {
  try {
    const cacheKey = `deputado_id_${nome}`;
    const cached = await getPublicDataCache('CAMARA', cacheKey);
    if (cached) return cached.id;

    const response = await axios.get(`${CAMARA_API_BASE}/deputados`, {
      params: { nome, ordem: 'ASC', ordenarPor: 'nome' }
    });

    const deputado = response.data.dados[0];
    if (deputado) {
      await savePublicDataCache('CAMARA', cacheKey, { id: deputado.id });
      return deputado.id;
    }
    return null;
  } catch (error) {
    logger.error(`[Camara] Erro ao buscar ID do deputado ${nome}: ${error}`);
    return null;
  }
}

/**
 * Busca votações recentes de um deputado
 */
export async function getVotacoesDeputado(deputadoId: number): Promise<Vote[]> {
  try {
    const cacheKey = `votacoes_v6_${deputadoId}`;
    const cached = await getPublicDataCache('CAMARA', cacheKey);
    if (cached) return cached;

    // Fallback: Buscar votações gerais e filtrar os votos
    const responseVotacoes = await axios.get(`${CAMARA_API_BASE}/votacoes`, {
      params: { ordem: 'DESC', ordenarPor: 'dataHoraRegistro', itens: 20 },
      headers: { 'Accept': 'application/json' }
    });

    const votosEncontrados: Vote[] = [];
    for (const votacao of responseVotacoes.data.dados) {
      try {
        const resVoto = await axios.get(`${CAMARA_API_BASE}/votacoes/${votacao.id}/votos`, {
          headers: { 'Accept': 'application/json' }
        });
        const votoDoDeputado = resVoto.data.dados.find((v: any) => v.deputado?.id === deputadoId);
        if (votoDoDeputado) {
          votosEncontrados.push({
            idVotacao: votacao.id,
            data: votacao.dataHoraRegistro,
            proposicao: votacao.proposicaoExterna?.siglaTipo + ' ' + votacao.proposicaoExterna?.numero + '/' + votacao.proposicaoExterna?.ano,
            voto: votoDoDeputado.tipoVoto,
            ementa: votacao.proposicaoExterna?.ementa || votacao.descricao || 'Sem ementa disponível'
          });
        }
      } catch (e) { continue; }
    }

    if (votosEncontrados.length > 0) {
      await savePublicDataCache('CAMARA', cacheKey, votosEncontrados);
    }
    return votosEncontrados;
  } catch (error) {
    logger.error(`[Camara] Erro ao buscar votações do deputado ${deputadoId}: ${error}`);
    return [];
  }
}

/**
 * Analisa se um voto contradiz uma promessa
 */
export function analisarIncoerencia(promessa: string, voto: Vote): { incoerente: boolean; justificativa: string } {
  const textoPromessa = promessa.toLowerCase();
  const ementaVoto = voto.ementa.toLowerCase();
  
  const temas = [
    { nome: 'educação', keywords: ['educação', 'escola', 'ensino', 'universidade', 'professor', 'merenda'] },
    { nome: 'saúde', keywords: ['saúde', 'hospital', 'médico', 'sus', 'vacina', 'medicamento'] },
    { nome: 'segurança', keywords: ['segurança', 'polícia', 'crime', 'violência', 'armas'] },
    { nome: 'economia', keywords: ['economia', 'imposto', 'tributo', 'fiscal', 'orçamento', 'gasto'] }
  ];

  for (const tema of temas) {
    const promessaSobreTema = tema.keywords.some(k => textoPromessa.includes(k));
    const votoSobreTema = tema.keywords.some(k => ementaVoto.includes(k));

    if (promessaSobreTema && votoSobreTema) {
      const votoContra = voto.voto === 'Não' || voto.voto === 'Obstrução' || voto.voto.includes('Contra');
      const promessaPositiva = ['aumentar', 'investir', 'apoiar', 'criar', 'melhorar'].some(p => textoPromessa.includes(p));

      if (promessaPositiva && votoContra) {
        return {
          incoerente: true,
          justificativa: `O político prometeu apoio à área de ${tema.nome}, mas votou "${voto.voto}" na proposição ${voto.proposicao} que trata de: ${voto.ementa}`
        };
      }
    }
  }

  return { incoerente: false, justificativa: '' };
}

/**
 * Busca proposições (projetos de lei) de um deputado
 */
export async function getProposicoesDeputado(deputadoId: number): Promise<any[]> {
  try {
    const cacheKey = `proposicoes_camara_${deputadoId}`;
    const cached = await getPublicDataCache('CAMARA', cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${CAMARA_API_BASE}/proposicoes`, {
      params: { idDeputadoAutor: deputadoId, ordem: 'DESC', ordenarPor: 'id', itens: 10 },
      headers: { 'Accept': 'application/json' }
    });

    const proposicoes = response.data.dados.map((p: any) => ({
      id: p.id,
      sigla: p.siglaTipo,
      numero: p.numero,
      ano: p.ano,
      ementa: p.ementa,
      url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`
    }));

    await savePublicDataCache('CAMARA', cacheKey, proposicoes);
    return proposicoes;
  } catch (error) {
    logger.error(`[Camara] Erro ao buscar proposições do deputado ${deputadoId}: ${error}`);
    return [];
  }
}
