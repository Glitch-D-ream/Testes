/**
 * Scout Agent Híbrido v2.1
 * Prioriza: APIs Oficiais -> Scraping Direto -> IA (Fallback)
 * Otimizado com Cache Inteligente e Paralelismo de Rede.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { multiScoutAgent } from './multi-scout.ts';
import { contentScraper } from '../modules/content-scraper.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { douService } from '../services/dou.service.ts';
import { transparenciaSPService } from '../services/transparencia-sp.service.ts';
import { portalTransparenciaService } from '../integrations/portal-transparencia.ts';
import { jurisprudenciaService } from '../services/jurisprudencia.service.ts';
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
  private readonly whitelist = [
    'g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'cnnbrasil.com.br',
    'valor.globo.com', 'bbc.com', 'elpais.com', 'uol.com.br', 'r7.com',
    'metropoles.com', 'poder360.com.br', 'agenciabrasil.ebc.com.br',
    'camara.leg.br', 'senado.leg.br', 'planalto.gov.br', 'gazetadopovo.com.br',
    'cartacapital.com.br', 'veja.abril.com.br', 'exame.com', 'infomoney.com.br'
  ];

  /**
   * Busca especializada em ausência (licitações, editais, projetos)
   */
  async searchAbsence(query: string, category: string): Promise<RawSource[]> {
    return IntelligentCache.get(`absence:${category}:${query}`, async () => {
      logInfo(`[ScoutHybrid] Iniciando busca de AUSÊNCIA para: ${query} (${category})`);
      
      const absenceQueries = [
        `site:gov.br "${query}" edital OR licitação OR "projeto executivo"`,
        `site:comprasgovernamentais.gov.br "${query}"`,
        `site:transparencia.gov.br "${query}"`,
        `"${query}" diário oficial licitação`
      ];

      const searchPromises = absenceQueries.map(q => directSearchImproved.search(q).catch(() => []));
      
      const spTransparenciaPromise = transparenciaSPService.search(query).catch(() => []);
      const federalTransparenciaPromise = portalTransparenciaService.searchExpenses(query).catch(() => []);
      const legalPromise = jurisprudenciaService.search(query).catch(() => []);
      
      const [results, spResults, federalResults, legalResults] = await Promise.all([
        Promise.all(searchPromises),
        spTransparenciaPromise,
        federalTransparenciaPromise,
        legalPromise
      ]);
      
      const flatResults = results.flat();
      const douActs = await douService.searchActs(query);
      const douResults = douActs.map(act => ({
        title: `[DOU] ${act.title}`,
        url: act.url,
        snippet: act.content.substring(0, 500),
        source: 'Diário Oficial da União',
        publishedAt: act.date
      }));

      const allResults = [
        ...flatResults, 
        ...douResults,
        ...spResults.map(r => ({
          title: `[SP-Transparência] ${r.title}`,
          url: r.url,
          snippet: r.description,
          source: 'Portal da Transparência SP',
          publishedAt: r.date
        })),
        ...federalResults.map(r => ({
          title: `[Federal-Transparência] ${r.description}`,
          url: r.url || '',
          snippet: `Valor: ${r.value} | Órgão: ${r.organ}`,
          source: 'Portal da Transparência Federal',
          publishedAt: r.date
        })),
        ...legalResults.map(r => ({
          title: `[Jurisprudência-${r.court}] ${r.title}`,
          url: r.url,
          snippet: r.description,
          source: `Tribunal ${r.court}`,
          publishedAt: r.date
        }))
      ];

      const sources: RawSource[] = [];
      const uniqueUrls = new Set<string>();

      for (const r of allResults) {
        if (uniqueUrls.has(r.url)) continue;
        uniqueUrls.add(r.url);

        sources.push({
          title: r.title,
          url: r.url,
          content: r.snippet,
          source: r.source,
          publishedAt: r.publishedAt,
          type: 'official',
          confidence: 'high',
          credibilityLayer: 'A'
        });
      }

      return sources;
    });
  }

  /**
   * Busca híbrida com priorização inteligente
   */
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    return IntelligentCache.get(`search:${deepSearch ? 'deep' : 'normal'}:${query}`, async () => {
      logInfo(`[ScoutHybrid] Iniciando busca híbrida (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
      
      const sources: RawSource[] = [];

      // FASE 1 & 2: Paralelismo Massivo (Deep Scout)
      logInfo(`[ScoutHybrid] FASE 1 & 2: Buscando em fontes oficiais, notícias, redes sociais e processos em paralelo...`);
      
      // Consultas variadas para simular comportamento humano e capturar discursos reais
      const variations = [
        query,
        `"${query}" promessas`,
        `"${query}" declarações recentes`,
        `"${query}" plano de governo`,
        `"${query}" polêmicas OR investigação`,
        `"${query}" entrevista completa`,
        `"${query}" discurso na íntegra`,
        `"${query}" declarou em entrevista`,
        `"${query}" disse ao vivo`
      ];

      const [officialResults, newsResults, interviewResults, legalResults, spResults, jusBrasilResults, socialResults, ...extraResults] = await Promise.all([
        officialSourcesSearch.search(query).catch(async (e) => { 
          logWarn(`[ScoutHybrid] APIs Oficiais falharam: ${e.message}. Ativando fallback via Browser...`);
          return directSearchImproved.search(`site:gov.br "${query}" OR site:jus.br "${query}"`);
        }),
        directSearchImproved.search(query).catch(() => []),
        directSearchImproved.search(`"${query}" entrevista OR declarou OR anunciou`).catch(() => []),
        directSearchImproved.search(`"${query}" processo judicial OR investigação OR tribunal`).catch(() => []),
        transparenciaSPService.search(query).catch(async () => {
          return directSearchImproved.search(`site:transparencia.sp.gov.br "${query}"`);
        }),
        jusBrasilScraper.searchAndScrape(query).catch(() => []),
        (multiScoutAgent as any).searchViaSocialRSS(query).catch(() => []),
        // Buscas extras para profundidade humana
        ...variations.slice(1).map(v => directSearchImproved.search(v).catch(() => []))
      ]);

      const directResults = [
        ...newsResults, 
        ...interviewResults, 
        ...legalResults,
        ...extraResults.flat(),
        ...spResults.map(r => ({ title: r.title, url: r.url, snippet: r.description, source: 'Portal da Transparência SP', publishedAt: r.date })),
        ...jusBrasilResults.map(r => ({ title: r.title, url: r.url, snippet: r.content.substring(0, 500), source: 'JusBrasil', publishedAt: new Date().toISOString() })),
        ...socialResults.map((r: any) => ({ title: r.title, url: r.url, snippet: r.content, source: r.source, publishedAt: r.publishedAt }))
      ];

      // Se tivermos poucas fontes de discursos, forçar uma busca específica
      if (directResults.filter(r => r.title.toLowerCase().includes('entrevista') || r.title.toLowerCase().includes('discurso')).length < 3) {
        logInfo(`[ScoutHybrid] Poucos discursos encontrados. Forçando busca de entrevistas...`);
        const speechResults = await directSearchImproved.search(`"${query}" entrevista OR discurso OR declarou`).catch(() => []);
        directResults.push(...speechResults);
      }

      if (directResults.length < 5) {
        const extraResults = await directSearchImproved.search(`${query} promessa política`).catch(() => []);
        directResults.push(...extraResults);
      }

      // Processar Oficiais
      sources.push(...officialResults.map(r => ({
        title: r.title, url: r.url, content: r.content, source: r.source, publishedAt: new Date().toISOString(),
        type: 'official' as const, confidence: 'high' as const, credibilityLayer: 'A' as const
      })));

      // Ingestão Paralela (Scraping)
      const uniqueDirectResults = directResults.filter(r => !sources.some(s => s.url === r.url)).slice(0, 10);
      logInfo(`[ScoutHybrid] Iniciando ingestão paralela de ${uniqueDirectResults.length} fontes...`);
      
      const directScrapePromises = uniqueDirectResults.map(async (r) => {
        try {
          const ingestionResult = await ingestionService.ingest(r.url);
          const fullContent = ingestionResult?.content || r.snippet;
          const url = r.url.toLowerCase();
          let layer: 'A' | 'B' | 'C' = 'B';
          if (url.includes('.gov.br') || url.includes('.leg.br')) layer = 'A';
          else if (url.includes('twitter.com') || url.includes('x.com')) layer = 'C';

          return {
            title: r.title, url: r.url, content: fullContent, source: r.source, publishedAt: r.publishedAt,
            type: 'news' as const, confidence: this.whitelist.some(d => r.url.includes(d)) ? 'high' as const : 'medium' as const,
            credibilityLayer: layer
          };
        } catch (e) { return null; }
      });

      const directScrapedSources = (await Promise.all(directScrapePromises)).filter(s => s !== null) as RawSource[];
      sources.push(...directScrapedSources);

      // FASE 3: Deep Search (Otimizado)
      if (sources.length < 5 && deepSearch) {
        logInfo(`[ScoutHybrid] FASE 3: Deep Search em portais de elite...`);
        const elitePortals = ['g1.globo.com', 'folha.uol.com.br', 'estadao.com.br'];
        
        const elitePromises = elitePortals.map(async (portal) => {
          const varResults = await directSearchImproved.search(`site:${portal} ${query} promessa OR anunciou`).catch(() => []);
          const uniqueVarResults = varResults.filter(r => !sources.some(s => s.url === r.url)).slice(0, 2);

          return Promise.all(uniqueVarResults.map(async (r) => {
            const fullContent = await Promise.race([
              contentScraper.scrape(r.url),
              new Promise<null>(resolve => setTimeout(() => resolve(null), 10000))
            ]);
            return {
              title: r.title, url: r.url, content: fullContent || r.snippet, source: r.source, publishedAt: r.publishedAt,
              type: 'news' as const, confidence: 'high' as const, credibilityLayer: 'B' as const
            };
          }));
        });

        const eliteResultsArrays = await Promise.all(elitePromises);
        eliteResultsArrays.flat().forEach(s => sources.push(s));
      }

      // FASE 4: IA Fallback
      if (sources.length < 2) {
        logWarn(`[ScoutHybrid] FASE 4: Ativando IA como fallback...`);
        try {
          const aiResults = await multiScoutAgent.search(query);
          aiResults.forEach(r => {
            if (!sources.some(s => s.url === r.url)) {
              sources.push({
                title: r.title, url: r.url, content: r.content, source: r.source, publishedAt: r.publishedAt,
                type: 'news', confidence: r.confidence, credibilityLayer: r.credibilityLayer
              });
            }
          });
        } catch (error) { logError(`[ScoutHybrid] Falha no fallback de IA`, error as Error); }
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

export const scoutHybrid = new ScoutHybrid();
