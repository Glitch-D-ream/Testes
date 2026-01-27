
/**
 * Scout Agent Híbrido v2.6 - IRONCLAD + DOCUMENT FALLBACK + FEDERAL TRANSPARENCY
 * Foco em resiliência extrema: se as APIs falham, ele busca documentos diretos.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { transparenciaSPService } from '../services/transparencia-sp.service.ts';
import { transparenciaPEService } from '../services/transparencia-pe.service.ts';
import { transparenciaFederalService } from '../services/transparencia-federal.service.ts';
import { IntelligentCache } from '../core/intelligent-cache.ts';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official' | 'document';
  confidence: 'high' | 'medium' | 'low';
  credibilityLayer: 'A' | 'B' | 'C';
}

export class ScoutHybrid {
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    return IntelligentCache.get(`search:${deepSearch ? 'deep' : 'normal'}:${query}`, async () => {
      logInfo(`[ScoutHybrid] Iniciando busca híbrida (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
      
      const sources: RawSource[] = [];
      const apiFailures: string[] = [];

      // FASE 1: Busca Paralela (Regional + Federal + Notícias)
      const isRegionalPE = query.toLowerCase().includes('jones manoel') || query.toLowerCase().includes('pernambuco');
      const isRegionalSP = query.toLowerCase().includes('erika hilton') || query.toLowerCase().includes('são paulo');

      // Queries expandidas para capturar atos oficiais e transparência
      const federalQuery = `${query} "Portal da Transparência" OR "Diário Oficial"`;
      
      const fastResults = await Promise.all([
        officialSourcesSearch.search(query).catch((e) => { apiFailures.push('Oficial'); return []; }),
        directSearchImproved.search(query).catch((e) => { apiFailures.push('Notícias'); return []; }),
        transparenciaFederalService.searchServidor(query).catch(() => { apiFailures.push('Federal'); return []; }),
        directSearchImproved.search(federalQuery).catch(() => []), // Busca extra por transparência
        isRegionalSP ? transparenciaSPService.search(query).catch(() => { apiFailures.push('SP'); return []; }) : Promise.resolve([]),
        isRegionalPE ? transparenciaPEService.search(query).catch(() => { apiFailures.push('PE'); return []; }) : Promise.resolve([])
      ]);

      const [officialResults, newsResults, federalResults, extraFederalResults, spResults, peResults] = fastResults;
      
      // Combinar resultados federais extras
      newsResults.push(...extraFederalResults);

      // Se detectarmos falhas em APIs críticas, ativamos o Fallback de Documentos
      if (apiFailures.length > 0 || deepSearch) {
        logWarn(`[ScoutHybrid] Detectadas falhas ou modo Deep. Ativando busca direta por Documentos/PDFs...`);
        const docQueries = [
          `${query} filetype:pdf`,
          `${query} "diário oficial"`,
          `${query} contrato OR empenho OR licitação`
        ];

        const docResults = await Promise.all(docQueries.map(q => directSearchImproved.search(q).catch(() => [])));
        const flatDocs = docResults.flat().slice(0, 5);

        logInfo(`[ScoutHybrid] Ingerindo ${flatDocs.length} documentos/PDFs encontrados diretamente...`);
        const docsIngested = await Promise.all(flatDocs.map(async (r) => {
          try {
            const result = await ingestionService.ingest(r.url, { keywords: [query] });
            return result ? {
              title: r.title, url: r.url, content: result.content, source: 'Documento Público', 
              type: 'document' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
            } : null;
          } catch { return null; }
        }));
        sources.push(...(docsIngested.filter(s => s !== null) as RawSource[]));
      }

      // Adicionar Resultados Oficiais
      sources.push(...officialResults.map(r => ({
        title: r.title, url: r.url, content: (r as any).content || r.description, source: (r as any).source || 'Portal Oficial', 
        type: 'official' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
      })));

      // Processar Notícias
      const newsToIngest = newsResults.slice(0, 5);
      const newsIngested = await Promise.all(newsToIngest.map(async (r) => {
        try {
          const content = await ingestionService.ingest(r.url);
          return content ? {
            title: r.title, url: r.url, content: content.content, source: r.source, type: 'news' as const, 
            confidence: 'medium' as const, credibilityLayer: 'B' as const
          } : null;
        } catch { return null; }
      }));
      sources.push(...(newsIngested.filter(s => s !== null) as RawSource[]));

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
