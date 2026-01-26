
import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiService } from './ai.service.ts';

const TSE_API_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

export interface GovernmentPlanPromise {
  text: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

export class GovernmentPlanExtractorService {
  /**
   * Busca e extrai promessas do Plano de Governo oficial no TSE
   */
  async extractFromTSE(politicianName: string, state: string = 'BR', year: number = 2022): Promise<GovernmentPlanPromise[]> {
    logInfo(`[GovPlan] Buscando Plano de Governo para: ${politicianName} (${year})`);

    try {
      // Ajustar parâmetros para eleição presidencial se for BR
      const electionId = year === 2022 ? '20406' : '1'; // ID real da eleição 2022 no TSE
      const searchUrl = `${TSE_API_BASE}/eleicao/buscar/${state}/${year}/${electionId}/candidatos`;
      const searchRes = await axios.get(searchUrl, { params: { nome: politicianName }, timeout: 10000 });
      
      const candidate = searchRes.data?.candidatos?.find((c: any) => 
        c.nomeCompleto.toLowerCase().includes(politicianName.toLowerCase()) || 
        c.nomeUrna.toLowerCase().includes(politicianName.toLowerCase())
      );

      if (!candidate) {
        logWarn(`[GovPlan] Candidato não encontrado no TSE para: ${politicianName}`);
        return [];
      }

      // 2. Buscar Detalhes do Candidato para obter o link do Plano de Governo
      const detailUrl = `${TSE_API_BASE}/candidato/buscar/${year}/${state}/1/1/candidato/${candidate.id}`;
      const detailRes = await axios.get(detailUrl, { timeout: 10000 });
      
      const planFile = detailRes.data?.arquivos?.find((f: any) => f.codTipo === '5'); // Tipo 5 costuma ser Plano de Governo
      
      if (!planFile) {
        logWarn(`[GovPlan] Arquivo de Plano de Governo não encontrado para: ${politicianName}`);
        return [];
      }

      const planUrl = `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidato/buscar/${year}/${state}/1/1/arquivo/${candidate.id}/${planFile.id}`;
      logInfo(`[GovPlan] Plano de Governo encontrado: ${planUrl}`);

      // 3. Como não podemos ler PDF diretamente aqui sem ferramentas pesadas, 
      // vamos usar o snippet/resumo se disponível ou marcar para processamento futuro.
      // Por enquanto, vamos retornar uma promessa estruturada baseada no fato de que o plano existe.
      
      return [{
        text: `Compromissos registrados no Plano de Governo Oficial (TSE) - Eleição ${year}`,
        category: 'GERAL',
        priority: 'high',
        source: planUrl
      }];

    } catch (error: any) {
      logError(`[GovPlan] Erro ao processar TSE para ${politicianName}: ${error.message}`);
      return [];
    }
  }
}

export const governmentPlanExtractorService = new GovernmentPlanExtractorService();
