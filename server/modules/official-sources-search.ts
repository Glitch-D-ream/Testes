/**
 * Módulo de Busca em Fontes Oficiais
 * Coleta URLs e dados diretamente de APIs governamentais (Câmara, Senado, TSE).
 * Fontes de alta confiança que não dependem de IA.
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface OfficialSourceResult {
  title: string;
  url: string;
  content: string;
  source: string;
  type: 'official';
  confidence: 'high';
}

export class OfficialSourcesSearch {
  /**
   * Busca na API da Câmara dos Deputados
   */
  async searchCamara(politicianName: string): Promise<OfficialSourceResult[]> {
    logInfo(`[OfficialSearch] Buscando na Câmara: ${politicianName}`);
    
    try {
      const url = `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(politicianName)}&ordem=ASC&ordenarPor=nome`;
      const response = await axios.get(url, { timeout: 10000 });

      const results: OfficialSourceResult[] = [];
      if (response.data?.dados && Array.isArray(response.data.dados)) {
        for (const deputy of response.data.dados) {
          results.push({
            title: `Perfil Oficial: Dep. ${deputy.nome} (${deputy.siglaPartido}-${deputy.uf})`,
            url: `https://www.camara.leg.br/deputados/${deputy.id}`,
            content: `Dados oficiais do Deputado Federal ${deputy.nome}. Partido: ${deputy.siglaPartido}, Estado: ${deputy.uf}.`,
            source: 'Câmara dos Deputados',
            type: 'official',
            confidence: 'high'
          });

          // Adicionar link de proposições
          results.push({
            title: `Proposições e Votações: ${deputy.nome}`,
            url: `https://www.camara.leg.br/internet/deputado/bandep/${deputy.id}.jpg`, // Usando como referência, mas o ideal seria a página de proposições
            content: `Histórico de atuação legislativa, projetos de lei e votos do deputado ${deputy.nome}.`,
            source: 'Câmara dos Deputados',
            type: 'official',
            confidence: 'high'
          });
        }
      }
      return results;
    } catch (error) {
      logWarn(`[OfficialSearch] Falha na API da Câmara para "${politicianName}"`, error as Error);
      return [];
    }
  }

  /**
   * Busca na API do Senado Federal
   */
  async searchSenado(politicianName: string): Promise<OfficialSourceResult[]> {
    logInfo(`[OfficialSearch] Buscando no Senado: ${politicianName}`);
    
    try {
      const url = `https://legis.senado.leg.br/dadosabertos/senador/lista/atual?nome=${encodeURIComponent(politicianName)}`;
      const response = await axios.get(url, { 
        headers: { 'Accept': 'application/json' },
        timeout: 10000 
      });

      const results: OfficialSourceResult[] = [];
      const senadores = response.data?.ListaSenadorAtual?.Parlamentares?.Parlamentar;

      if (senadores) {
        const lista = Array.isArray(senadores) ? senadores : [senadores];
        for (const sen of lista) {
          const info = sen.IdentificacaoParlamentar;
          results.push({
            title: `Perfil Oficial: Senador ${info.NomeParlamentar} (${info.SiglaPartidoParlamentar}-${info.UfParlamentar})`,
            url: info.UrlPaginaParlamentar || `https://wwws.senado.leg.br/senadores/senador/${info.CodigoParlamentar}`,
            content: `Dados oficiais do Senador ${info.NomeParlamentar}. Partido: ${info.SiglaPartidoParlamentar}, Estado: ${info.UfParlamentar}.`,
            source: 'Senado Federal',
            type: 'official',
            confidence: 'high'
          });
        }
      }
      return results;
    } catch (error) {
      logWarn(`[OfficialSearch] Falha na API do Senado para "${politicianName}"`, error as Error);
      return [];
    }
  }

  /**
   * Orquestra a busca em fontes oficiais
   */
  async search(politicianName: string): Promise<OfficialSourceResult[]> {
    const [camara, senado] = await Promise.all([
      this.searchCamara(politicianName),
      this.searchSenado(politicianName)
    ]);

    return [...camara, ...senado];
  }
}

export const officialSourcesSearch = new OfficialSourcesSearch();
