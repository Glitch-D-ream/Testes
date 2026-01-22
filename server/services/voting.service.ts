
import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';

export interface Vote {
  data: string;
  tema: string;
  voto: string;
  descricao: string;
}

export class VotingService {
  /**
   * Busca as últimas votações de um deputado na API da Câmara
   * Usa um período maior para garantir que encontre votos relevantes
   */
  async getPoliticianVotes(politicianId: string): Promise<Vote[]> {
    logInfo(`[Voting] Buscando histórico de votações para o deputado ID: ${politicianId}`);
    
    try {
      // A API da Câmara permite buscar as votações de um parlamentar específico
      // através do endpoint de deputados/{id}/votacoes
      const response = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/deputados/${politicianId}/votacoes`, {
        params: { 
          ordem: 'DESC', 
          ordenarPor: 'dataHoraRegistro'
        }
      }).catch(err => {
        // Se o endpoint direto falhar (405), tentamos o fallback de busca global
        return null;
      });

      let votacoes = [];
      if (response && response.data && response.data.dados) {
        votacoes = response.data.dados;
      } else {
        // Fallback: Buscar votações gerais e filtrar (mais lento, mas seguro)
        const globalResp = await axios.get(`https://dadosabertos.camara.leg.br/api/v2/votacoes`, {
          params: { ordem: 'DESC', ordenarPor: 'dataHoraRegistro' }
        });
        votacoes = globalResp.data.dados;
      }

      const votes: Vote[] = [];

      for (const v of votacoes.slice(0, 20)) {
        try {
          const votoResp = await axios.get(`https://api.camara.leg.br/api/v2/votacoes/${v.id}/votos`);
          const votosData = votoResp.data.dados;
          
          const votoDeputado = votosData.find((d: any) => 
            d.deputado && d.deputado.id.toString() === politicianId
          );

          if (votoDeputado) {
            votes.push({
              data: v.dataHoraRegistro ? v.dataHoraRegistro.split('T')[0] : 'Data N/A',
              tema: v.proposicaoObjeto || v.ementa || 'Votação Diversa',
              voto: votoDeputado.tipoVoto,
              descricao: v.ementa || 'Sem descrição disponível'
            });
          }
        } catch (e) {
          continue;
        }
        
        if (votes.length >= 10) break;
      }

      return votes;
    } catch (error) {
      logError('[Voting] Erro crítico ao buscar votações', error as Error);
      return [];
    }
  }

  /**
   * Verifica se o político votou contra um tema específico
   */
  async checkInconsistency(politicianId: string, category: string): Promise<{
    votedAgainst: boolean;
    relevantVotes: Vote[];
  }> {
    const votes = await this.getPoliticianVotes(politicianId);
    
    const keywords: Record<string, string[]> = {
      'EDUCAÇÃO': ['FUNDEB', 'ENSINO', 'ESCOLA', 'PROFESSOR', 'EDUCAÇÃO', 'MEC', 'PISO'],
      'SAÚDE': ['SAÚDE', 'SUS', 'VACINA', 'HOSPITAL', 'MÉDICOS', 'ENFERMAGEM'],
      'SEGURANÇA': ['ARMAS', 'SEGURANÇA', 'POLÍCIA', 'PENAL', 'CRIME', 'DROGAS'],
      'ECONOMIA': ['TETO', 'GASTOS', 'IMPOSTO', 'REFORMA', 'ORÇAMENTO', 'FISCAL', 'TRIBUTÁRIA']
    };

    const themeKeywords = keywords[category.toUpperCase()] || [];
    const relevantVotes = votes.filter(v => 
      themeKeywords.some(k => 
        (v.tema && v.tema.toUpperCase().includes(k)) || 
        (v.descricao && v.descricao.toUpperCase().includes(k))
      )
    );

    // Consideramos inconsistente se ele votou "Não" ou "Obstrução" em temas da categoria
    // Nota: A lógica pode ser refinada para entender se o projeto era "Pró" ou "Contra" o tema
    const votedAgainst = relevantVotes.some(v => v.voto === 'Não' || v.voto === 'Obstrução');

    return {
      votedAgainst,
      relevantVotes
    };
  }
}

export const votingService = new VotingService();
