/**
 * Integração com o Querido Diário (Open Knowledge Brasil)
 * Documentação: https://queridodiario.ok.org.br/api/docs
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface QueridoDiarioResult {
  title: string;
  url: string;
  content: string;
  source: string;
  type: 'official';
  confidence: 'medium';
}

export class QueridoDiarioIntegration {
  private readonly apiUrl = 'https://queridodiario.ok.org.br/api/v1';

  /**
   * Busca menções em diários oficiais municipais
   */
  async searchMentions(nome: string, cidade?: string): Promise<QueridoDiarioResult[]> {
    logInfo(`[QueridoDiario] Buscando menções de "${nome}"${cidade ? ` em ${cidade}` : ''}`);
    
    try {
      const params: any = {
        q: nome,
        limit: 5
      };
      
      // Se tiver cidade, poderíamos filtrar pelo código IBGE (exigido pela API)
      // Por enquanto, usamos a busca textual global
      const response = await axios.get(`${this.apiUrl}/gazettes/`, { params, timeout: 15000 });
      
      const results: QueridoDiarioResult[] = [];
      
      if (response.data?.gazettes && Array.isArray(response.data.gazettes)) {
        response.data.gazettes.forEach((g: any) => {
          results.push({
            title: `Diário Oficial: ${g.territory_name} (${g.date})`,
            url: g.url,
            content: `Menção encontrada no Diário Oficial de ${g.territory_name}. Data: ${g.date}. Excerto: ${g.excerpt || 'Clique para ver o conteúdo completo.'}`,
            source: `Querido Diário - ${g.territory_name}`,
            type: 'official',
            confidence: 'medium'
          });
        });
      }

      return results;
    } catch (error) {
      logWarn(`[QueridoDiario] Falha na busca para "${nome}"`, error as Error);
      return [];
    }
  }
}

export const queridoDiarioIntegration = new QueridoDiarioIntegration();
