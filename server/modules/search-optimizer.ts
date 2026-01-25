/**
 * Módulo de Otimização de Busca
 * Implementa estratégias avançadas para encontrar informações sobre figuras públicas menos conhecidas
 * 
 * Estratégias:
 * 1. Refinamento de Query: Adiciona contexto (cargo, estado, partido) para melhorar resultados
 * 2. Busca Alternativa: Tenta variações do nome (apelido, sobrenome, iniciais)
 * 3. Busca em Fontes Oficiais: Câmara, Senado, TSE, Prefeituras
 * 4. Busca em Redes Sociais: Twitter/X, Facebook, Instagram
 * 5. Busca em Bases de Dados: Jornalísticas e legislativas
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { getPublicDataCache, savePublicDataCache } from '../core/database.ts';

export interface SearchStrategy {
  name: string;
  priority: number;
  execute: (query: string) => Promise<any[]>;
}

export class SearchOptimizer {
  private readonly officialSources = {
    camara: 'https://www.camara.leg.br/internet/deputado/bandep/',
    senado: 'https://www.senado.leg.br/senadores/',
    tse: 'https://www.tse.jus.br/',
    planalto: 'https://www.planalto.gov.br/'
  };

  private readonly socialMediaSearchPatterns = {
    twitter: (name: string) => `site:twitter.com "${name}" OR site:x.com "${name}"`,
    facebook: (name: string) => `site:facebook.com "${name}"`,
    instagram: (name: string) => `site:instagram.com "${name}"`
  };

  /**
   * Otimiza a busca por um político, tentando múltiplas estratégias
   */
  async optimizedSearch(politicianName: string): Promise<any[]> {
    logInfo(`[SearchOptimizer] Iniciando busca otimizada para: ${politicianName}`);

    const results: any[] = [];

    // Estratégia 1: Busca em Cache (se existir)
    const cachedResults = await this.searchInCache(politicianName);
    if (cachedResults.length > 0) {
      logInfo(`[SearchOptimizer] Encontrado em cache: ${cachedResults.length} resultados`);
      return cachedResults;
    }

    // Estratégia 2: Busca em Fontes Oficiais
    try {
      const officialResults = await this.searchInOfficialSources(politicianName);
      results.push(...officialResults);
      logInfo(`[SearchOptimizer] Fontes oficiais: ${officialResults.length} resultados`);
    } catch (error) {
      logWarn(`[SearchOptimizer] Erro ao buscar em fontes oficiais`, error as Error);
    }

    // Estratégia 3: Refinamento de Query com Contexto
    if (results.length < 3) {
      try {
        const refinedResults = await this.searchWithRefinedQueries(politicianName);
        results.push(...refinedResults);
        logInfo(`[SearchOptimizer] Queries refinadas: ${refinedResults.length} resultados`);
      } catch (error) {
        logWarn(`[SearchOptimizer] Erro ao refinar queries`, error as Error);
      }
    }

    // Estratégia 4: Busca por Variações do Nome
    if (results.length < 3) {
      try {
        const nameVariations = this.generateNameVariations(politicianName);
        for (const variation of nameVariations) {
          const variationResults = await this.searchByNameVariation(variation);
          results.push(...variationResults);
          if (results.length >= 5) break;
        }
        logInfo(`[SearchOptimizer] Variações de nome: ${results.length} resultados`);
      } catch (error) {
        logWarn(`[SearchOptimizer] Erro ao buscar variações de nome`, error as Error);
      }
    }

    // Estratégia 5: Busca em Redes Sociais
    if (results.length < 3) {
      try {
        const socialResults = await this.searchInSocialMedia(politicianName);
        results.push(...socialResults);
        logInfo(`[SearchOptimizer] Redes sociais: ${socialResults.length} resultados`);
      } catch (error) {
        logWarn(`[SearchOptimizer] Erro ao buscar em redes sociais`, error as Error);
      }
    }

    // Salvar em cache para futuras buscas
    if (results.length > 0) {
      await savePublicDataCache(
        'SEARCH_RESULTS',
        politicianName,
        results,
        7 // 7 dias de cache
      );
    }

    return results;
  }

  /**
   * Busca em cache de resultados anteriores
   */
  private async searchInCache(politicianName: string): Promise<any[]> {
    try {
      const cached = await getPublicDataCache('SEARCH_RESULTS', politicianName);
      return cached ? (Array.isArray(cached) ? cached : [cached]) : [];
    } catch (error) {
      logWarn(`[SearchOptimizer] Erro ao acessar cache`, error as Error);
      return [];
    }
  }

  /**
   * Busca em fontes oficiais (Câmara, Senado, TSE)
   */
  private async searchInOfficialSources(politicianName: string): Promise<any[]> {
    const results: any[] = [];

    try {
      // Busca na Câmara dos Deputados
      const camaraUrl = `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(politicianName)}`;
      const camaraResponse = await axios.get(camaraUrl, { timeout: 10000 });

      if (camaraResponse.data?.dados && Array.isArray(camaraResponse.data.dados)) {
        camaraResponse.data.dados.forEach((deputy: any) => {
          results.push({
            name: deputy.nome,
            source: 'Câmara dos Deputados',
            url: `https://www.camara.leg.br/internet/deputado/bandep/${deputy.id}.jpg`,
            party: deputy.siglaPartido,
            state: deputy.uf,
            office: 'Deputado Federal',
            confidence: 'high'
          });
        });
      }
    } catch (error) {
      logWarn(`[SearchOptimizer] Erro ao buscar na Câmara`, error as Error);
    }

    try {
      // Busca no Senado
      const senadoUrl = `https://www.senado.leg.br/transparencia/api/v2/senadores?nome=${encodeURIComponent(politicianName)}`;
      const senadoResponse = await axios.get(senadoUrl, { timeout: 10000 });

      if (senadoResponse.data?.dados && Array.isArray(senadoResponse.data.dados)) {
        senadoResponse.data.dados.forEach((senator: any) => {
          results.push({
            name: senator.nome,
            source: 'Senado Federal',
            url: senator.urlFoto,
            party: senator.siglaPartido,
            state: senator.uf,
            office: 'Senador',
            confidence: 'high'
          });
        });
      }
    } catch (error) {
      logWarn(`[SearchOptimizer] Erro ao buscar no Senado`, error as Error);
    }

    return results;
  }

  /**
   * Refina queries adicionando contexto comum
   */
  private async searchWithRefinedQueries(politicianName: string): Promise<any[]> {
    const refinedQueries = [
      `${politicianName} deputado federal`,
      `${politicianName} vereador`,
      `${politicianName} prefeito`,
      `${politicianName} senador`,
      `${politicianName} político`,
      `${politicianName} promessas`,
      `${politicianName} votações`
    ];

    const results: any[] = [];

    for (const query of refinedQueries) {
      try {
        // Usar DuckDuckGo com query refinada
        const response = await axios.get('https://html.duckduckgo.com/html/', {
          params: { q: query },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        });

        const html = response.data;
        const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
        let match;
        let count = 0;

        while ((match = resultRegex.exec(html)) !== null && count < 2) {
          const url = new URL(match[1], 'https://duckduckgo.com').searchParams.get('uddg') || match[1];
          results.push({
            title: match[2].trim(),
            url: url,
            source: 'DuckDuckGo (Refined)',
            confidence: 'medium'
          });
          count++;
        }

        if (results.length >= 5) break;
      } catch (error) {
        logWarn(`[SearchOptimizer] Erro ao buscar com query refinada: ${query}`, error as Error);
      }
    }

    return results;
  }

  /**
   * Gera variações do nome para busca alternativa
   */
  private generateNameVariations(name: string): string[] {
    const parts = name.trim().split(/\s+/);
    const variations: string[] = [];

    // Nome completo
    variations.push(name);

    // Primeiro + Último
    if (parts.length > 1) {
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`);
    }

    // Apenas primeiro nome
    if (parts.length > 0) {
      variations.push(parts[0]);
    }

    // Apenas último nome
    if (parts.length > 1) {
      variations.push(parts[parts.length - 1]);
    }

    // Iniciais
    const initials = parts.map(p => p[0]).join('');
    variations.push(initials);

    // Remover duplicatas
    return Array.from(new Set(variations));
  }

  /**
   * Busca por variações do nome
   */
  private async searchByNameVariation(variation: string): Promise<any[]> {
    try {
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: variation },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 8000
      });

      const html = response.data;
      const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
      let match;
      const results: any[] = [];
      let count = 0;

      while ((match = resultRegex.exec(html)) !== null && count < 2) {
        const url = new URL(match[1], 'https://duckduckgo.com').searchParams.get('uddg') || match[1];
        results.push({
          title: match[2].trim(),
          url: url,
          source: `DuckDuckGo (Variation: ${variation})`,
          confidence: 'low'
        });
        count++;
      }

      return results;
    } catch (error) {
      logWarn(`[SearchOptimizer] Erro ao buscar variação: ${variation}`, error as Error);
      return [];
    }
  }

  /**
   * Busca em redes sociais
   */
  private async searchInSocialMedia(politicianName: string): Promise<any[]> {
    const results: any[] = [];

    // Construir queries para redes sociais
    const queries = [
      `"${politicianName}" site:twitter.com OR site:x.com`,
      `"${politicianName}" site:facebook.com`,
      `"${politicianName}" site:instagram.com`
    ];

    for (const query of queries) {
      try {
        const response = await axios.get('https://html.duckduckgo.com/html/', {
          params: { q: query },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 8000
        });

        const html = response.data;
        const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
        let match;
        let count = 0;

        while ((match = resultRegex.exec(html)) !== null && count < 1) {
          const url = new URL(match[1], 'https://duckduckgo.com').searchParams.get('uddg') || match[1];
          results.push({
            title: match[2].trim(),
            url: url,
            source: 'Social Media',
            confidence: 'medium'
          });
          count++;
        }
      } catch (error) {
        logWarn(`[SearchOptimizer] Erro ao buscar em redes sociais: ${query}`, error as Error);
      }
    }

    return results;
  }
}

export const searchOptimizer = new SearchOptimizer();
