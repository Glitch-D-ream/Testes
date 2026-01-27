
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

export class TransparenciaFederalService {
  private baseUrl = 'https://api.portaldatransparencia.gov.br/api-de-dados';
  private token = process.env.TRANSPARENCIA_TOKEN || '';

  async searchServidor(nome: string) {
    if (!this.token) {
      logInfo('[TransparenciaFederal] Token não configurado. Usando fallback de busca direta.');
      return null;
    }

    try {
      logInfo(`[TransparenciaFederal] Buscando servidor: ${nome}`);
      const response = await axios.get(`${this.baseUrl}/servidores`, {
        params: { nome, pagina: 1 },
        headers: { 'chave-api-dados': this.token },
        timeout: 10000
      });
      return response.data;
    } catch (e: any) {
      logError(`[TransparenciaFederal] Falha na busca: ${e.message}`);
      return null;
    }
  }

  /**
   * Busca contratos relacionados ao nome (pode ser empresa ou pessoa citada)
   */
  async searchContratos(termo: string) {
    try {
      logInfo(`[TransparenciaFederal] Buscando contratos/licitações: ${termo}`);
      // Simulação de endpoint ou busca via Dorking se API falhar
      return []; 
    } catch (e) {
      return [];
    }
  }
}

export const transparenciaFederalService = new TransparenciaFederalService();
