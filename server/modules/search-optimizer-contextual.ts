/**
 * Módulo de Otimização de Busca com Contexto
 * Utiliza informações adicionais (cargo, estado, cidade, partido) para refinar a busca
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { getPublicDataCache, savePublicDataCache } from '../core/database.ts';

export interface ContextualSearchParams {
  name: string;
  office?: string;
  state?: string;
  city?: string;
  party?: string;
}

export interface SearchResult {
  name: string;
  source: string;
  url?: string;
  office?: string;
  state?: string;
  party?: string;
  confidence: 'high' | 'medium' | 'low';
  relevance: number; // 0-100
}

export class SearchOptimizerContextual {
  /**
   * Busca otimizada com contexto
   */
  async optimizedContextualSearch(params: ContextualSearchParams): Promise<SearchResult[]> {
    logInfo(`[SearchOptimizerContextual] Iniciando busca contextualizada: ${JSON.stringify(params)}`);

    // Construir chave de cache com contexto
    const cacheKey = this.buildCacheKey(params);
    
    // Estratégia 1: Verificar cache
    const cachedResults = await this.searchInCache(cacheKey);
    if (cachedResults.length > 0) {
      logInfo(`[SearchOptimizerContextual] Encontrado em cache: ${cachedResults.length} resultados`);
      return cachedResults;
    }

    const results: SearchResult[] = [];

    // Estratégia 2: Busca em Fontes Oficiais (com contexto)
    try {
      const officialResults = await this.searchInOfficialSourcesContextual(params);
      results.push(...officialResults);
      logInfo(`[SearchOptimizerContextual] Fontes oficiais: ${officialResults.length} resultados`);
    } catch (error) {
      logWarn(`[SearchOptimizerContextual] Erro ao buscar em fontes oficiais`, error as Error);
    }

    // Se encontrou em fontes oficiais, retornar
    if (results.length > 0) {
      await savePublicDataCache('CONTEXTUAL_SEARCH', cacheKey, results, 7);
      return results;
    }

    // Estratégia 3: Busca Web com Query Contextualizada
    try {
      const webResults = await this.searchWebContextual(params);
      results.push(...webResults);
      logInfo(`[SearchOptimizerContextual] Web contextualizada: ${webResults.length} resultados`);
    } catch (error) {
      logWarn(`[SearchOptimizerContextual] Erro ao buscar na web`, error as Error);
    }

    // Estratégia 4: Busca em Redes Sociais com Contexto
    if (results.length < 3) {
      try {
        const socialResults = await this.searchSocialMediaContextual(params);
        results.push(...socialResults);
        logInfo(`[SearchOptimizerContextual] Redes sociais: ${socialResults.length} resultados`);
      } catch (error) {
        logWarn(`[SearchOptimizerContextual] Erro ao buscar em redes sociais`, error as Error);
      }
    }

    // Salvar em cache
    if (results.length > 0) {
      await savePublicDataCache('CONTEXTUAL_SEARCH', cacheKey, results, 7);
    }

    return results;
  }

  /**
   * Busca em fontes oficiais com contexto
   */
  private async searchInOfficialSourcesContextual(params: ContextualSearchParams): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Câmara dos Deputados
    if (!params.office || params.office.toLowerCase().includes('deputado')) {
      try {
        const camaraUrl = `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(params.name)}`;
        const response = await axios.get(camaraUrl, { timeout: 10000 });

        if (response.data?.dados && Array.isArray(response.data.dados)) {
          response.data.dados.forEach((deputy: any) => {
            // Verificar se corresponde ao contexto
            if (params.state && deputy.uf !== params.state.toUpperCase()) {
              return; // Skip se estado não corresponde
            }

            if (params.party && deputy.siglaPartido !== params.party.toUpperCase()) {
              return; // Skip se partido não corresponde
            }

            results.push({
              name: deputy.nome,
              source: 'Câmara dos Deputados',
              url: `https://www.camara.leg.br/internet/deputado/bandep/${deputy.id}.jpg`,
              office: 'Deputado Federal',
              state: deputy.uf,
              party: deputy.siglaPartido,
              confidence: 'high',
              relevance: this.calculateRelevance(params, {
                name: deputy.nome,
                office: 'Deputado Federal',
                state: deputy.uf,
                party: deputy.siglaPartido
              })
            });
          });
        }
      } catch (error) {
        logWarn(`[SearchOptimizerContextual] Erro ao buscar na Câmara`, error as Error);
      }
    }

    // Senado Federal
    if (!params.office || params.office.toLowerCase().includes('senador')) {
      try {
        const senadoUrl = `https://www.senado.leg.br/transparencia/api/v2/senadores?nome=${encodeURIComponent(params.name)}`;
        const response = await axios.get(senadoUrl, { timeout: 10000 });

        if (response.data?.dados && Array.isArray(response.data.dados)) {
          response.data.dados.forEach((senator: any) => {
            if (params.state && senator.uf !== params.state.toUpperCase()) {
              return;
            }

            if (params.party && senator.siglaPartido !== params.party.toUpperCase()) {
              return;
            }

            results.push({
              name: senator.nome,
              source: 'Senado Federal',
              url: senator.urlFoto,
              office: 'Senador',
              state: senator.uf,
              party: senator.siglaPartido,
              confidence: 'high',
              relevance: this.calculateRelevance(params, {
                name: senator.nome,
                office: 'Senador',
                state: senator.uf,
                party: senator.siglaPartido
              })
            });
          });
        }
      } catch (error) {
        logWarn(`[SearchOptimizerContextual] Erro ao buscar no Senado`, error as Error);
      }
    }

    return results;
  }

  /**
   * Busca web com query contextualizada
   */
  private async searchWebContextual(params: ContextualSearchParams): Promise<SearchResult[]> {
    // Construir query contextualizada
    const queryParts = [params.name];
    if (params.office) queryParts.push(params.office);
    if (params.state) queryParts.push(params.state);
    if (params.city) queryParts.push(params.city);
    if (params.party) queryParts.push(params.party);

    const query = queryParts.join(' ');

    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      let match;
      const results: SearchResult[] = [];
      let count = 0;

      while ((match = resultRegex.exec(html)) !== null && count < 5) {
        const url = new URL(match[1], 'https://duckduckgo.com').searchParams.get('uddg') || match[1];
        const title = match[2].trim();
        const snippet = match[3].trim();

        results.push({
          name: params.name,
          source: 'DuckDuckGo (Contextualizado)',
          url: url,
          office: params.office,
          state: params.state,
          party: params.party,
          confidence: 'medium',
          relevance: this.calculateWebRelevance(title, snippet, params)
        });

        count++;
      }

      return results;
    } catch (error) {
      logWarn(`[SearchOptimizerContextual] Erro ao buscar na web`, error as Error);
      return [];
    }
  }

  /**
   * Busca em redes sociais com contexto
   */
  private async searchSocialMediaContextual(params: ContextualSearchParams): Promise<SearchResult[]> {
    const queryParts = [params.name];
    if (params.office) queryParts.push(params.office);
    if (params.state) queryParts.push(params.state);

    const query = `"${queryParts.join(' ')}" site:twitter.com OR site:x.com OR site:facebook.com`;

    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
      let match;
      const results: SearchResult[] = [];
      let count = 0;

      while ((match = resultRegex.exec(html)) !== null && count < 3) {
        const url = new URL(match[1], 'https://duckduckgo.com').searchParams.get('uddg') || match[1];

        results.push({
          name: params.name,
          source: 'Redes Sociais',
          url: url,
          office: params.office,
          state: params.state,
          party: params.party,
          confidence: 'low',
          relevance: 50
        });

        count++;
      }

      return results;
    } catch (error) {
      logWarn(`[SearchOptimizerContextual] Erro ao buscar em redes sociais`, error as Error);
      return [];
    }
  }

  /**
   * Calcula relevância de um resultado baseado no contexto
   */
  private calculateRelevance(params: ContextualSearchParams, result: any): number {
    let relevance = 100;

    // Reduzir se o nome não corresponder exatamente
    if (result.name.toLowerCase() !== params.name.toLowerCase()) {
      relevance -= 20;
    }

    // Reduzir se o estado não corresponder
    if (params.state && result.state !== params.state.toUpperCase()) {
      relevance -= 15;
    }

    // Reduzir se o partido não corresponder
    if (params.party && result.party !== params.party.toUpperCase()) {
      relevance -= 15;
    }

    // Reduzir se o cargo não corresponder
    if (params.office && !result.office?.toLowerCase().includes(params.office.toLowerCase())) {
      relevance -= 10;
    }

    return Math.max(0, relevance);
  }

  /**
   * Calcula relevância de um resultado web
   */
  private calculateWebRelevance(title: string, snippet: string, params: ContextualSearchParams): number {
    let relevance = 50;
    const text = (title + ' ' + snippet).toLowerCase();

    // Aumentar se contiver o nome
    if (text.includes(params.name.toLowerCase())) {
      relevance += 20;
    }

    // Aumentar se contiver o cargo
    if (params.office && text.includes(params.office.toLowerCase())) {
      relevance += 15;
    }

    // Aumentar se contiver o estado
    if (params.state && text.includes(params.state.toLowerCase())) {
      relevance += 15;
    }

    // Aumentar se contiver a cidade
    if (params.city && text.includes(params.city.toLowerCase())) {
      relevance += 15;
    }

    return Math.min(100, relevance);
  }

  /**
   * Busca em cache com chave contextualizada
   */
  private async searchInCache(cacheKey: string): Promise<SearchResult[]> {
    try {
      const cached = await getPublicDataCache('CONTEXTUAL_SEARCH', cacheKey);
      return cached ? (Array.isArray(cached) ? cached : [cached]) : [];
    } catch (error) {
      logWarn(`[SearchOptimizerContextual] Erro ao acessar cache`, error as Error);
      return [];
    }
  }

  /**
   * Constrói chave de cache a partir dos parâmetros
   */
  private buildCacheKey(params: ContextualSearchParams): string {
    return [
      params.name,
      params.office || 'ANY',
      params.state || 'ANY',
      params.city || 'ANY',
      params.party || 'ANY'
    ].join('|');
  }
}

export const searchOptimizerContextual = new SearchOptimizerContextual();
