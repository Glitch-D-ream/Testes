
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface Deputado {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
}

export class CamaraApiService {
  private baseUrl = 'https://dadosabertos.camara.leg.br/api/v2';

  /**
   * Busca o ID do deputado pelo nome
   */
  async findDeputadoId(nome: string): Promise<number | null> {
    try {
      logInfo(`[CamaraAPI] Buscando ID para: ${nome}`);
      const response = await axios.get(`${this.baseUrl}/deputados`, {
        params: { nome, ordem: 'ASC', ordenarPor: 'nome' },
        timeout: 10000
      });

      const dados = response.data.dados;
      if (dados && dados.length > 0) {
        logInfo(`[CamaraAPI] ID encontrado: ${dados[0].id} (${dados[0].nome})`);
        return dados[0].id;
      }
      return null;
    } catch (e: any) {
      logError(`[CamaraAPI] Erro ao buscar ID: ${e.message}`);
      return null;
    }
  }

  /**
   * Busca discursos recentes do deputado
   */
  async getDiscursos(id: number): Promise<any[]> {
    try {
      logInfo(`[CamaraAPI] Buscando discursos para ID: ${id}`);
      const response = await axios.get(`${this.baseUrl}/deputados/${id}/discursos`, {
        params: { ordem: 'DESC', ordenarPor: 'dataHoraInicio' },
        timeout: 10000
      });
      return response.data.dados || [];
    } catch (e: any) {
      logWarn(`[CamaraAPI] Erro ao buscar discursos: ${e.message}`);
      return [];
    }
  }

  /**
   * Busca despesas recentes do deputado (Cota Parlamentar)
   */
  async getDespesas(id: number): Promise<any[]> {
    try {
      logInfo(`[CamaraAPI] Buscando despesas para ID: ${id}`);
      const response = await axios.get(`${this.baseUrl}/deputados/${id}/despesas`, {
        params: { ordem: 'DESC', ordenarPor: 'ano' },
        timeout: 10000
      });
      return response.data.dados || [];
    } catch (e: any) {
      logWarn(`[CamaraAPI] Erro ao buscar despesas: ${e.message}`);
      return [];
    }
  }

  /**
   * Busca proposições (projetos de lei) de autoria do deputado
   */
  async getProposicoes(id: number): Promise<any[]> {
    try {
      logInfo(`[CamaraAPI] Buscando proposições para ID: ${id}`);
      const response = await axios.get(`${this.baseUrl}/proposicoes`, {
        params: { idDeputadoAutor: id, ordem: 'DESC', ordenarPor: 'id' },
        timeout: 10000
      });
      return response.data.dados || [];
    } catch (e: any) {
      logWarn(`[CamaraAPI] Erro ao buscar proposições: ${e.message}`);
      return [];
    }
  }
}

export const camaraApiService = new CamaraApiService();
