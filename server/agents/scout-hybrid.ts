/**
 * Scout Agent Híbrido v2.3 - IRONCLAD + REGIONAL
 * Foco em velocidade, resiliência e inteligência regional.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { douService } from '../services/dou.service.ts';
import { transparenciaSPService } from '../services/transparencia-sp.service.ts';
import { transparenciaPEService } from '../services/transparencia-pe.service.ts';
import { jusBrasilScraper } from '../modules/jusbrasil-scraper.ts';
import { IntelligentCache } from '../core/intelligent-cache.ts';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official';
  confidence: 'high' | 'medium' | 'low';
  credibilityLayer: 'A' | 'B' | 'C';
}

export class ScoutHybrid {
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    return IntelligentCache.get(`search:${deepSearch ? 'deep' : 'normal'}:${query}`, async () => {
      logInfo(`[ScoutHybrid] Iniciando busca híbrida (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
      
      const sources: RawSource[] = [];

      // FASE 1: Busca Rápida Paralela (Timeout de 15s)
      logInfo(`[ScoutHybrid] FASE 1: Busca rápida em fontes oficiais, regionais e notícias...`);
      
      // Detecção dinâmica de região (Simples por enquanto)
      const isRegionalPE = query.toLowerCase().includes('jones manoel') || query.toLowerCase().includes('pernambuco');
      const isRegionalSP = query.toLowerCase().includes('erika hilton') || query.toLowerCase().includes('são paulo');

      const fastResults = await Promise.all([
        officialSourcesSearch.search(query).catch(() => []),
        directSearchImproved.search(query).catch(() => []),
        isRegionalSP ? transparenciaSPService.search(query).catch(() => []) : Promise.resolve([]),
        isRegionalPE ? transparenciaPEService.search(query).catch(() => []) : Promise.resolve([])
      ]);

      const [officialResults, newsResults, spResults, peResults] = fastResults;

      // Adicionar Oficiais e Regionais
      const combinedOfficial = [...officialResults, ...spResults, ...peResults];
      sources.push(...combinedOfficial.map(r => ({
        title: r.title, url: r.url, content: (r as any).content || r.description, source: (r as any).source || 'Portal Transparência', 
        publishedAt: new Date().toISOString(),
        type: 'official' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
      })));

      // Ingestão de Notícias (Limitado a 5 fontes rápidas)
      const newsToIngest = newsResults.slice(0, 5);
      logInfo(`[ScoutHybrid] Ingerindo ${newsToIngest.length} notícias rápidas...`);
      
      const newsIngested = await Promise.all(newsToIngest.map(async (r) => {
        try {
          const content = await Promise.race([
            ingestionService.ingest(r.url),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 8000))
          ]);
          return content ? {
            title: r.title, url: r.url, content: content.content, source: r.source, publishedAt: r.publishedAt,
            type: 'news' as const, confidence: 'medium' as const, credibilityLayer: 'B' as const
          } : null;
        } catch { return null; }
      }));

      sources.push(...(newsIngested.filter(s => s !== null) as RawSource[]));

      if (sources.length >= 5 && !deepSearch) return sources;

      // FASE 2: Deep Search
      logInfo(`[ScoutHybrid] FASE 2: Executando Deep Search...`);
      const extraResults = await Promise.all([
        directSearchImproved.search(`"${query}" entrevista OR discurso OR atuação regional`).catch(() => []),
        jusBrasilScraper.searchAndScrape(query).catch(() => []),
        douService.searchActs(query).catch(() => [])
      ]);

      const [extraNews, jusResults, douResults] = extraResults;
      
      // Adicionar resultados do Deep Search
      sources.push(...jusResults.map(r => ({
        title: r.title, url: r.url, content: r.content, source: 'JusBrasil', type: 'official' as const, 
        confidence: 'high' as const, credibilityLayer: 'A' as const
      })));

      return sources.filter(s => this.isValidUrl(s.url));
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch { return false; }
  }
}

export const scoutHybrid = new ScoutHybrid();
