
/**
 * Scout Hybrid Otimizado v3.3
 * Respeita a triagem do FilterAgent para evitar ingestão desnecessária
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
import { filterAgentOptimized } from './filter-optimized.ts';

export interface RawSource {
  title: string;
  url: string;
  content?: string;
  snippet?: string;
  description?: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official' | 'document';
  confidence: 'high' | 'medium' | 'low';
  credibilityLayer: 'A' | 'B' | 'C';
  shouldIngestFull?: boolean;
}

export class ScoutHybridOptimized {
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    return IntelligentCache.get(`search:optimized:${deepSearch ? 'deep' : 'normal'}:${query}`, async () => {
      logInfo(`[ScoutHybridOptimized] Iniciando busca otimizada (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
      
      const sources: RawSource[] = [];
      const apiFailures: string[] = [];

      // FASE 1: Busca Paralela (Regional + Federal + Notícias) - SEM INGESTÃO PROFUNDA AINDA
      const isRegionalPE = query.toLowerCase().includes('jones manoel') || query.toLowerCase().includes('pernambuco');
      const isRegionalSP = query.toLowerCase().includes('erika hilton') || query.toLowerCase().includes('são paulo');

      const federalQuery = `${query} "Portal da Transparência" OR "Diário Oficial"`;
      
      const fastResults = await Promise.all([
        officialSourcesSearch.search(query).catch((e) => { apiFailures.push('Oficial'); return []; }),
        directSearchImproved.search(query).catch((e) => { apiFailures.push('Notícias'); return []; }),
        transparenciaFederalService.searchServidor(query).catch(() => { apiFailures.push('Federal'); return []; }),
        directSearchImproved.search(federalQuery).catch(() => []),
        isRegionalSP ? transparenciaSPService.search(query).catch(() => { apiFailures.push('SP'); return []; }) : Promise.resolve([]),
        isRegionalPE ? transparenciaPEService.search(query).catch(() => { apiFailures.push('PE'); return []; }) : Promise.resolve([])
      ]);

      const [officialResults, newsResults, federalResults, extraFederalResults, spResults, peResults] = fastResults;
      
      // FASE 1.5: Busca em APIs Oficiais (Câmara) - SEMPRE INGERE PROFUNDO
      const camaraId = await camaraApiService.findDeputadoId(query);
      if (camaraId) {
        logInfo(`[ScoutHybridOptimized] Deputado Federal detectado. Coletando dados oficiais da Câmara...`);
        const [discursos, despesas, proposicoes] = await Promise.all([
          camaraApiService.getDiscursos(camaraId),
          camaraApiService.getDespesas(camaraId),
          camaraApiService.getProposicoes(camaraId)
        ]);

        if (discursos.length > 0) {
          sources.push({
            title: `Discursos Oficiais - Câmara dos Deputados`,
            url: `https://www.camara.leg.br/deputados/${camaraId}`,
            content: discursos.slice(0, 5).map(d => `[${d.dataHoraInicio}] ${d.transcricao}`).join('\n\n'),
            source: 'Câmara dos Deputados',
            type: 'official',
            confidence: 'high',
            credibilityLayer: 'A',
            shouldIngestFull: true
          });
        }

        if (despesas.length > 0) {
          const resumoDespesas = despesas.slice(0, 10).map(d => `${d.tipoDespesa}: R$ ${d.valorLiquido} (${d.dataDocumento})`).join('\n');
          sources.push({
            title: `Gastos Parlamentares Recentes`,
            url: `https://www.camara.leg.br/deputados/${camaraId}`,
            content: `RESUMO DE GASTOS:\n${resumoDespesas}`,
            source: 'Cota Parlamentar',
            type: 'official',
            confidence: 'high',
            credibilityLayer: 'A',
            shouldIngestFull: true
          });
        }
      }

      // Combinar resultados federais extras
      newsResults.push(...extraFederalResults);

      // FASE 2: Adicionar Resultados Oficiais (Camada A - sempre ingere profundo)
      sources.push(...officialResults.map(r => ({
        title: r.title, 
        url: r.url, 
        snippet: r.description,
        source: (r as any).source || 'Portal Oficial', 
        type: 'official' as const, 
        confidence: 'high' as const, 
        credibilityLayer: 'A' as const,
        shouldIngestFull: true // Camada A sempre
      })));

      // FASE 3: Filtrar Notícias com Triagem Inteligente (Camada B/C)
      logInfo(`[ScoutHybridOptimized] Aplicando triagem inteligente em ${newsResults.length} notícias...`);
      const filteredNews = await filterAgentOptimized.filter(newsResults.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        description: r.description,
        source: r.source,
        type: 'news',
        confidence: 'medium',
        credibilityLayer: 'B'
      })));

      // FASE 4: Ingestão Profunda APENAS para Fontes Marcadas
      logInfo(`[ScoutHybridOptimized] Iniciando ingestão profunda para ${filteredNews.filter(s => s.shouldIngestFull).length} fontes selecionadas...`);
      
      const newsToIngest = filteredNews.filter(s => s.shouldIngestFull).slice(0, 5);
      const newsIngested = await Promise.all(newsToIngest.map(async (r) => {
        try {
          const content = await ingestionService.ingest(r.url);
          return content ? {
            title: r.title, 
            url: r.url, 
            content: content.content, 
            source: r.source, 
            type: 'news' as const, 
            confidence: 'medium' as const, 
            credibilityLayer: 'B' as const,
            shouldIngestFull: true
          } : null;
        } catch { return null; }
      }));
      
      sources.push(...(newsIngested.filter(s => s !== null) as RawSource[]));

      // FASE 5: Fallback para Documentos se necessário
      if (apiFailures.length > 0 || deepSearch) {
        logWarn(`[ScoutHybridOptimized] Detectadas falhas ou modo Deep. Ativando busca direta por Documentos/PDFs...`);
        const docQueries = [
          `${query} filetype:pdf`,
          `${query} "diário oficial"`,
          `${query} contrato OR empenho OR licitação`
        ];

        const docResults = await Promise.all(docQueries.map(q => directSearchImproved.search(q).catch(() => [])));
        const flatDocs = docResults.flat().slice(0, 5);

        logInfo(`[ScoutHybridOptimized] Ingerindo ${flatDocs.length} documentos/PDFs encontrados diretamente...`);
        const docsIngested = await Promise.all(flatDocs.map(async (r) => {
          try {
            const result = await ingestionService.ingest(r.url, { keywords: [query] });
            return result ? {
              title: r.title, url: r.url, content: result.content, source: 'Documento Público', 
              type: 'document' as const, confidence: 'high' as const, credibilityLayer: 'A' as const,
              shouldIngestFull: true
            } : null;
          } catch { return null; }
        }));
        sources.push(...(docsIngested.filter(s => s !== null) as RawSource[]));
      }

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

export const scoutHybridOptimized = new ScoutHybridOptimized();
