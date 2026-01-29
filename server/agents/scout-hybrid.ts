
/**
 * Scout Agent Híbrido v2.7 - PERFORMANCE OPTIMIZED
 * Foco em resiliência extrema e PARALELISMO REAL.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { transparenciaSPService } from '../services/transparencia-sp.service.ts';
import { transparenciaPEService } from '../services/transparencia-pe.service.ts';
import { transparenciaFederalService } from '../services/transparencia-federal.service.ts';
import { camaraApiService } from '../services/camara-api.service.ts';
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
      const federalQuery = `${query} "Portal da Transparência" OR "Diário Oficial"`;
      
      logInfo(`[ScoutHybrid] Executando Fase 1: Busca Multidimensional Paralela...`);
      const fastResults = await Promise.all([
        officialSourcesSearch.search(query).catch((e) => { apiFailures.push('Oficial'); return []; }),
        directSearchImproved.search(query).catch((e) => { apiFailures.push('Notícias'); return []; }),
        transparenciaFederalService.searchServidor(query).catch(() => { apiFailures.push('Federal'); return []; }),
        directSearchImproved.search(federalQuery).catch(() => []),
        isRegionalSP ? transparenciaSPService.search(query).catch(() => { apiFailures.push('SP'); return []; }) : Promise.resolve([]),
        isRegionalPE ? transparenciaPEService.search(query).catch(() => { apiFailures.push('PE'); return []; }) : Promise.resolve([]),
        camaraApiService.findDeputadoId(query).catch(() => null),
        directSearchImproved.searchWikipedia(query).catch(() => [])
      ]);

      const [officialResults, newsResults, federalResults, extraFederalResults, spResults, peResults, camaraId, wikiResults] = fastResults;
      
      // FASE 2: Processamento de APIs Oficiais e Documentos em Paralelo
      logInfo(`[ScoutHybrid] Executando Fase 2: Ingestão e APIs Especializadas...`);
      
      const parallelTasks: Promise<void>[] = [];

      // Task: Câmara dos Deputados
      if (camaraId) {
        parallelTasks.push((async () => {
          logInfo(`[ScoutHybrid] Coletando dados oficiais da Câmara (ID: ${camaraId})...`);
          const [discursos, despesas] = await Promise.all([
            camaraApiService.getDiscursos(camaraId).catch(() => []),
            camaraApiService.getDespesas(camaraId).catch(() => [])
          ]);

          if (discursos.length > 0) {
            sources.push({
              title: `Discursos Oficiais - Câmara dos Deputados`,
              url: `https://www.camara.leg.br/deputados/${camaraId}`,
              content: discursos.slice(0, 20).map(d => `[${d.dataHoraInicio}] ${d.transcricao}`).join('\n\n'),
              source: 'Câmara dos Deputados',
              type: 'official',
              confidence: 'high',
              credibilityLayer: 'A'
            });
          }

          if (despesas.length > 0) {
            const resumoDespesas = despesas.slice(0, 50).map(d => `${d.tipoDespesa}: R$ ${d.valorLiquido} (${d.dataDocumento})`).join('\n');
            sources.push({
              title: `Gastos Parlamentares Recentes`,
              url: `https://www.camara.leg.br/deputados/${camaraId}`,
              content: `RESUMO DE GASTOS:\n${resumoDespesas}`,
              source: 'Cota Parlamentar',
              type: 'official',
              confidence: 'high',
              credibilityLayer: 'A'
            });
          }
        })());
      }

      // Task: Ingestão de Documentos (se necessário)
      const allNews = [...newsResults, ...extraFederalResults];
      if (apiFailures.length > 0 || deepSearch) {
        parallelTasks.push((async () => {
          logWarn(`[ScoutHybrid] Ativando busca paralela por Documentos/PDFs...`);
          const docQueries = [
            `${query} filetype:pdf`,
            `${query} "diário oficial"`,
            `${query} contrato OR empenho OR licitação`
          ];

          const docSearchResults = await Promise.all(docQueries.map(q => directSearchImproved.search(q).catch(() => [])));
          const flatDocs = docSearchResults.flat().slice(0, 15);

          logInfo(`[ScoutHybrid] Ingerindo ${flatDocs.length} documentos em paralelo...`);
          const docsIngested = await Promise.all(flatDocs.map(r => 
            ingestionService.ingest(r.url, { keywords: [query] }).then(result => result ? {
              title: r.title, url: r.url, content: result.content, source: 'Documento Público', 
              type: 'document' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
            } : null).catch(() => null)
          ));
          sources.push(...(docsIngested.filter(s => s !== null) as RawSource[]));
        })());
      }

      // Task: Ingestão de Notícias Principal
      parallelTasks.push((async () => {
        const newsToIngest = allNews.slice(0, 15);
        logInfo(`[ScoutHybrid] Ingerindo ${newsToIngest.length} notícias em paralelo...`);
        const newsIngested = await Promise.all(newsToIngest.map(r => 
          ingestionService.ingest(r.url).then(content => content ? {
            title: r.title, url: r.url, content: content.content, source: r.source, type: 'news' as const, 
            confidence: 'medium' as const, credibilityLayer: 'B' as const
          } : null).catch(() => null)
        ));
        sources.push(...(newsIngested.filter(s => s !== null) as RawSource[]));
      })());

      // Adicionar resultados regionais e oficiais que já temos
      sources.push(...officialResults.map(r => ({
        title: r.title, url: r.url, content: (r as any).content || r.description, source: (r as any).source || 'Portal Oficial', 
        type: 'official' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
      })));
      sources.push(...spResults.map(r => ({ ...r, type: 'official' as const, credibilityLayer: 'A' as const })));
      sources.push(...peResults.map(r => ({ ...r, type: 'official' as const, credibilityLayer: 'A' as const })));
      sources.push(...wikiResults.map(r => ({
        title: r.title, url: r.url, content: r.content || r.snippet, source: 'Wikipedia',
        type: 'news' as const, confidence: 'medium' as const, credibilityLayer: 'B' as const
      })));

      // Aguardar todas as tarefas paralelas
      await Promise.all(parallelTasks);

      logInfo(`[ScoutHybrid] Busca finalizada. Total de fontes: ${sources.length}`);
      return sources.filter(s => this.isValidUrl(s.url));
    });
  }

  /**
   * Busca especializada em ausência (licitações, editais, diários oficiais)
   */
  async searchAbsence(query: string, category: string): Promise<RawSource[]> {
    logInfo(`[ScoutHybrid] Buscando ausência técnica para: ${query} [${category}]`);
    const searchQueries = [
      `${query} "licitação" OR "edital" OR "contrato"`,
      `${query} "diário oficial" OR "portal da transparência"`,
      `${query} "projeto executivo" OR "empenho"`
    ];

    const results = await Promise.all(
      searchQueries.map(q => directSearchImproved.search(q).catch(() => []))
    );

    const flatResults = results.flat().slice(0, 10);
    const ingested = await Promise.all(
      flatResults.map(r => ingestionService.ingest(r.url).then(res => res ? {
        title: r.title, url: r.url, content: res.content, source: r.source,
        type: 'official' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
      } : null).catch(() => null))
    );

    return ingested.filter(s => s !== null) as RawSource[];
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch { return false; }
  }
}

export const scoutHybrid = new ScoutHybrid();
