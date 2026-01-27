
import axios from 'axios';
import { logInfo, logError } from '../core/logger.ts';

export interface FinanceEvidence {
  type: 'EXPENSE' | 'PROPOSAL' | 'VOTING';
  description: string;
  value?: number;
  date: string;
  source: string;
  link?: string;
}

export class FinanceService {
  private camaraBaseUrl = 'https://dadosabertos.camara.leg.br/api/v2';

  /**
   * Busca gastos da cota parlamentar (Cota para Exercício da Atividade Parlamentar)
   */
  async getParlamentaryExpenses(deputadoId: number, year: number = 2024): Promise<FinanceEvidence[]> {
    logInfo(`[FinanceService] Buscando gastos para Deputado ${deputadoId} em ${year}`);
    try {
      const response = await axios.get(`${this.camaraBaseUrl}/deputados/${deputadoId}/despesas`, {
        params: { ano: year, ordem: 'DESC', ordenarPor: 'mes' },
        headers: { 'Accept': 'application/json' }
      });

      const gastos = response.data.dados || [];
      return gastos.map((g: any) => ({
        type: 'EXPENSE',
        description: g.tipoDespesa,
        value: g.valorLiquido,
        date: `${g.ano}-${String(g.mes).padStart(2, '0')}-01`,
        source: 'Câmara dos Deputados (Cota Parlamentar)',
        link: g.urlDocumento
      }));
    } catch (error) {
      logError(`[FinanceService] Erro ao buscar gastos:`, error as Error);
      return [];
    }
  }

  /**
   * Busca proposições (incluindo emendas e projetos) do deputado
   */
  async getProposals(deputadoId: number, year: number = 2024): Promise<FinanceEvidence[]> {
    logInfo(`[FinanceService] Buscando proposições para Deputado ${deputadoId} em ${year}`);
    try {
      const response = await axios.get(`${this.camaraBaseUrl}/proposicoes`, {
        params: { idDeputadoAutor: deputadoId, ano: year, ordem: 'DESC', ordenarPor: 'id' },
        headers: { 'Accept': 'application/json' }
      });

      const proposicoes = response.data.dados || [];
      return proposicoes.map((p: any) => ({
        type: 'PROPOSAL',
        description: `${p.siglaTipo} ${p.numero}/${p.ano}: ${p.ementa}`,
        date: year.toString(),
        source: 'Câmara dos Deputados (Proposições)',
        link: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`
      }));
    } catch (error) {
      logError(`[FinanceService] Erro ao buscar proposições:`, error as Error);
      return [];
    }
  }

  /**
   * Mock para Emendas Pix (Enquanto não temos chave da API do Portal da Transparência)
   * Em produção, isso usaria a API do Portal com a chave correta.
   */
  async getPixEmendas(parlamentarName: string): Promise<FinanceEvidence[]> {
    logInfo(`[FinanceService] Buscando Emendas Pix para ${parlamentarName} (Simulação)`);
    // Simulando busca que seria feita no Portal da Transparência
    return [
      {
        type: 'EXPENSE',
        description: `Transferência Especial (Emenda Pix) destinada a Municípios`,
        value: 1500000,
        date: '2024-05-20',
        source: 'Portal da Transparência (Simulado)',
        link: 'https://portaldatransparencia.gov.br/emendas'
      }
    ];
  }
}

export const financeService = new FinanceService();
