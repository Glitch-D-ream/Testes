/**
 * Integração com a API da Câmara dos Deputados
 * Documentação: https://dadosabertos.camara.leg.br/swagger/recursos.html
 */
import axios from 'axios';
import logger from '../core/logger.ts';
import { cacheService } from '../services/cache.service.ts';

const CAMARA_API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

export interface Vote {
  idVotacao: string;
  data: string;
  proposicao: string;
  voto: string;
  ementa: string;
  orientacao?: string; // Orientação do partido
  rebeldia?: boolean; // Se votou contra o partido
  incoerencia?: boolean;
  justificativa?: string;
}

/**
 * Busca o ID de um deputado pelo nome
 */
export async function getDeputadoId(nome: string): Promise<number | null> {
  try {
    const cacheKey = `camara:deputado_id:${nome}`;
    const cached = await cacheService.getGenericData<{id: number}>(cacheKey);
    if (cached) return cached.id;

    const response = await axios.get(`${CAMARA_API_BASE}/deputados`, {
      params: { nome, ordem: 'ASC', ordenarPor: 'nome' }
    });

    // Busca exata ou por partes do nome
    const dados = response.data.dados || [];
    let deputado = dados.find((d: any) => d.nome.toLowerCase() === nome.toLowerCase());
    if (!deputado && dados.length > 0) deputado = dados[0];
    
    if (deputado) {
      await cacheService.saveGenericData(cacheKey, 'CAMARA', { id: deputado.id }, 30);
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
    const cacheKey = `camara:votacoes:${deputadoId}`;
    const cached = await cacheService.getGenericData<Vote[]>(cacheKey);
    if (cached) return cached;

    // Buscar votações recentes gerais e filtrar pelo deputado
    const responseVotacoes = await axios.get(`${CAMARA_API_BASE}/votacoes`, {
      params: { ordem: 'DESC', ordenarPor: 'dataHoraRegistro', itens: 20 },
      headers: { 'Accept': 'application/json' }
    });

    const votosEncontrados: Vote[] = [];
    const dadosVotacoes = responseVotacoes.data.dados || [];

    for (const votacao of dadosVotacoes) {
      try {
        const resVotos = await axios.get(`${CAMARA_API_BASE}/votacoes/${votacao.id}/votos`, {
          headers: { 'Accept': 'application/json' }
        });
        
        const listaVotos = resVotos.data.dados || [];
        const votoDoDeputado = listaVotos.find((v: any) => v.deputado?.id === deputadoId);
        
        if (votoDoDeputado) {
          const resOrientacao = await axios.get(`${CAMARA_API_BASE}/votacoes/${votacao.id}/orientacoes`, {
            headers: { 'Accept': 'application/json' }
          }).catch(() => ({ data: { dados: [] } }));

          const siglaPartido = votoDoDeputado.deputado?.siglaPartido;
          const orientacaoPartido = resOrientacao.data.dados.find((o: any) => o.siglaPartidoBloco === siglaPartido)?.orientacaoVoto;
          
          const rebeldia = orientacaoPartido && 
                          ((votoDoDeputado.tipoVoto === 'Sim' && orientacaoPartido === 'Não') || 
                           (votoDoDeputado.tipoVoto === 'Não' && orientacaoPartido === 'Sim'));

          votosEncontrados.push({
            idVotacao: votacao.id,
            data: votacao.dataHoraRegistro,
            proposicao: votacao.proposicaoExterna?.siglaTipo + ' ' + votacao.proposicaoExterna?.numero + '/' + votacao.proposicaoExterna?.ano,
            voto: votoDoDeputado.tipoVoto,
            ementa: votacao.proposicaoExterna?.ementa || votacao.descricao || 'Sem ementa disponível',
            orientacao: orientacaoPartido || 'N/A',
            rebeldia: !!rebeldia
          });
        }
      } catch (e) { continue; }
    }

    if (votosEncontrados.length > 0) {
      await cacheService.saveGenericData(cacheKey, 'CAMARA', votosEncontrados, 7);
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
    const cacheKey = `camara:proposicoes:${deputadoId}`;
    const cached = await cacheService.getGenericData<any[]>(cacheKey);
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

    await cacheService.saveGenericData(cacheKey, 'CAMARA', proposicoes, 7);
    return proposicoes;
  } catch (error) {
    logger.error(`[Camara] Erro ao buscar proposições do deputado ${deputadoId}: ${error}`);
    return [];
  }
}
