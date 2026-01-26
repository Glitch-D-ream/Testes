/**
 * Scout Agent Híbrido v2.0
 * Prioriza: APIs Oficiais -> Scraping Direto -> IA (Fallback)
 * Isso garante URLs reais sem depender de limites de taxa de IA.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { multiScoutAgent } from './multi-scout.ts';
import { contentScraper } from '../modules/content-scraper.ts';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official';
  confidence: 'high' | 'medium' | 'low';
}

export class ScoutHybrid {
  private readonly whitelist = [
    'g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'cnnbrasil.com.br',
    'valor.globo.com', 'bbc.com', 'elpais.com', 'uol.com.br', 'r7.com',
    'metropoles.com', 'poder360.com.br', 'agenciabrasil.ebc.com.br',
    'camara.leg.br', 'senado.leg.br', 'planalto.gov.br', 'gazetadopovo.com.br',
    'cartacapital.com.br', 'veja.abril.com.br', 'exame.com', 'infomoney.com.br'
  ];

  /**
   * Busca híbrida com priorização inteligente
   */
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    logInfo(`[ScoutHybrid] Iniciando busca híbrida (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
    
    const sources: RawSource[] = [];

    // PARALELIZAR FASE 1 E FASE 2
    logInfo(`[ScoutHybrid] FASE 1 & 2: Buscando em fontes oficiais e scraping direto em paralelo...`);
    const [officialResults, directResults] = await Promise.all([
      officialSourcesSearch.search(query).catch(e => { logWarn(`Oficiais falharam: ${e.message}`); return []; }),
      directSearchImproved.search(query).catch(e => { logWarn(`Busca direta falhou: ${e.message}`); return []; })
    ]);

    // Se poucas fontes, tentar variações (Sugestão DeepSeek)
    if (directResults.length < 3) {
      logInfo(`[ScoutHybrid] Poucas fontes. Tentando variação: ${query} promessa`);
      const extraResults = await directSearchImproved.search(`${query} promessa`).catch(() => []);
      directResults.push(...extraResults);
    }

    // Processar Oficiais
    sources.push(...officialResults.map(r => ({
      title: r.title,
      url: r.url,
      content: r.content,
      source: r.source,
      publishedAt: new Date().toISOString(),
      type: 'official' as const,
      confidence: 'high' as const
    })));
    logInfo(`[ScoutHybrid] Fontes oficiais encontradas: ${officialResults.length}`);

    // Processar Diretos (Scraping)
    const uniqueDirectResults = directResults.filter(r => !sources.some(s => s.url === r.url)).slice(0, 8); // Limitar a 8 fontes para evitar lentidão
    
    logInfo(`[ScoutHybrid] Iniciando scraping paralelo de ${uniqueDirectResults.length} fontes...`);
    const directScrapePromises = uniqueDirectResults.map(async (r) => {
      try {
        const fullContent = await contentScraper.scrape(r.url);
        return {
          title: r.title,
          url: r.url,
          content: fullContent || r.snippet,
          source: r.source,
          publishedAt: r.publishedAt,
          type: 'news' as const,
          confidence: this.whitelist.some(d => r.url.includes(d)) ? 'high' as const : 'medium' as const
        };
      } catch (e) {
        return null;
      }
    });

    const directScrapedSources = (await Promise.all(directScrapePromises)).filter(s => s !== null) as RawSource[];
    sources.push(...directScrapedSources);
    logInfo(`[ScoutHybrid] Scraping direto concluído.`);

    // FASE 3: Deep Search com variações de query focadas em portais de elite
    if (sources.length < 5 && deepSearch) {
      logInfo(`[ScoutHybrid] FASE 3: Deep Search em portais de elite...`);
      const elitePortals = ['g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'poder360.com.br'];
      
      const elitePromises = elitePortals.map(async (portal) => {
        const eliteQuery = `site:${portal} ${query} promessa OR anunciou OR projeto`;
        const varResults = await directSearchImproved.search(eliteQuery);
        
        const uniqueVarResults = varResults.filter(r => !sources.some(s => s.url === r.url));
        return Promise.all(uniqueVarResults.map(async (r) => {
          const fullContent = await contentScraper.scrape(r.url);
          return {
            title: r.title,
            url: r.url,
            content: fullContent || r.snippet,
            source: r.source,
            publishedAt: r.publishedAt,
            type: 'news' as const,
            confidence: 'high' as const
          };
        }));
      });

      const eliteResultsArrays = await Promise.all(elitePromises);
      for (const eliteResults of eliteResultsArrays) {
        sources.push(...eliteResults);
        if (sources.length >= 15) break;
      }
    }

    // FASE 4: IA como Fallback (apenas se ainda não temos URLs suficientes)
    if (sources.length < 2) {
      logWarn(`[ScoutHybrid] FASE 4: Ativando IA como fallback (${sources.length} fontes encontradas)`);
      try {
        const aiResults = await multiScoutAgent.search(query);
        aiResults.forEach(r => {
          if (!sources.some(s => s.url === r.url)) {
            sources.push({
              title: r.title,
              url: r.url,
              content: r.content,
              source: r.source,
              publishedAt: r.publishedAt,
              type: 'news',
              confidence: r.confidence
            });
          }
        });
        logInfo(`[ScoutHybrid] IA encontrou: ${aiResults.length}`);
      } catch (error) {
        logError(`[ScoutHybrid] Falha no fallback de IA`, error as Error);
      }
    }

    // Validar URLs
    const validSources = sources.filter(s => this.isValidUrl(s.url));
    logInfo(`[ScoutHybrid] Total de fontes válidas: ${validSources.length}`);

    return validSources;
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const scoutHybrid = new ScoutHybrid();
