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
import { ingestionService } from '../services/ingestion.service.ts';
import { douService } from '../services/dou.service.ts';
import { transparenciaSPService } from '../services/transparencia-sp.service.ts';
import { portalTransparenciaService } from '../integrations/portal-transparencia.ts';
import { jurisprudenciaService } from '../services/jurisprudencia.service.ts';
import { jusBrasilScraper } from '../modules/jusbrasil-scraper.ts';

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
    logInfo(`[ScoutHybrid] Iniciando busca de AUSÊNCIA para: ${query} (${category})`);
    
    const absenceQueries = [
      `site:gov.br "${query}" edital OR licitação OR "projeto executivo"`,
      `site:comprasgovernamentais.gov.br "${query}"`,
      `site:transparencia.gov.br "${query}"`,
      `"${query}" diário oficial licitação`
    ];

    const searchPromises = absenceQueries.map(q => directSearchImproved.search(q).catch(() => []));
    
    // Busca complementar nos Portais de Transparência e Jurisprudência
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

    // Busca complementar no DOU (Diário Oficial da União)
    logInfo(`[ScoutHybrid] Iniciando busca complementar no DOU.`);
    const douActs = await douService.searchActs(query);
    const douResults = douActs.map(act => ({
      title: `[DOU] ${act.title}`,
      url: act.url,
      snippet: act.content.substring(0, 500),
      source: 'Diário Oficial da União',
      publishedAt: act.date
    }));

    // Combinar resultados
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

    // Filtrar e formatar
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
  }

  /**
   * Busca híbrida com priorização inteligente
   */
  async search(query: string, deepSearch: boolean = false): Promise<RawSource[]> {
    logInfo(`[ScoutHybrid] Iniciando busca híbrida (${deepSearch ? 'DEEP' : 'NORMAL'}): ${query}`);
    
    const sources: RawSource[] = [];

    // PARALELIZAR FASE 1 E FASE 2 + Buscas Especializadas
    logInfo(`[ScoutHybrid] FASE 1 & 2: Buscando em fontes oficiais, notícias e processos em paralelo...`);
    const [officialResults, newsResults, interviewResults, legalResults, spResults, jusBrasilResults] = await Promise.all([
      officialSourcesSearch.search(query).catch(e => { logWarn(`Oficiais falharam: ${e.message}`); return []; }),
      directSearchImproved.search(query).catch(e => { logWarn(`Busca direta falhou: ${e.message}`); return []; }),
      directSearchImproved.search(`"${query}" entrevista OR declarou OR anunciou`).catch(() => []),
      directSearchImproved.search(`"${query}" processo judicial OR investigação OR tribunal`).catch(() => []),
      transparenciaSPService.search(query).catch(() => []),
      jusBrasilScraper.searchAndScrape(query).catch(() => [])
    ]);

    const directResults = [
      ...newsResults, 
      ...interviewResults, 
      ...legalResults,
      ...spResults.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        source: 'Portal da Transparência SP',
        publishedAt: r.date
      })),
      ...jusBrasilResults.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content.substring(0, 500),
        source: 'JusBrasil',
        publishedAt: new Date().toISOString()
      }))
    ];

    // Se poucas fontes, tentar variações
    if (directResults.length < 5) {
      logInfo(`[ScoutHybrid] Poucas fontes. Tentando variação: ${query} promessa política`);
      const extraResults = await directSearchImproved.search(`${query} promessa política`).catch(() => []);
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
      confidence: 'high' as const,
      credibilityLayer: 'A' as const
    })));
    logInfo(`[ScoutHybrid] Fontes oficiais encontradas: ${officialResults.length}`);

    // Processar Diretos (Scraping)
    const uniqueDirectResults = directResults.filter(r => !sources.some(s => s.url === r.url)).slice(0, 8); // Limitar a 8 fontes para evitar lentidão
    
    logInfo(`[ScoutHybrid] Iniciando ingestão paralela de ${uniqueDirectResults.length} fontes (Multi-formato)...`);
    const directScrapePromises = uniqueDirectResults.map(async (r) => {
      try {
        // Usar IngestionService para lidar com PDF, DOCX, XLSX e HTML
        const ingestionResult = await ingestionService.ingest(r.url);
        const fullContent = ingestionResult?.content || r.snippet;
        
        const url = r.url.toLowerCase();
        let layer: 'A' | 'B' | 'C' = 'B';
        if (url.includes('.gov.br') || url.includes('.leg.br')) layer = 'A';
        else if (url.includes('twitter.com') || url.includes('x.com')) layer = 'C';

        return {
          title: r.title,
          url: r.url,
          content: fullContent,
          source: r.source,
          publishedAt: r.publishedAt,
          type: 'news' as const,
          confidence: this.whitelist.some(d => r.url.includes(d)) ? 'high' as const : 'medium' as const,
          credibilityLayer: layer,
          metadata: ingestionResult?.metadata
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
      
      // Otimização: Limitar o número de portais de elite e processar em paralelo com controle de concorrência
      const elitePromises = elitePortals.slice(0, 3).map(async (portal) => {
        const eliteQuery = `site:${portal} ${query} promessa OR anunciou OR projeto`;
        const varResults = await directSearchImproved.search(eliteQuery).catch(() => []);
        
        const uniqueVarResults = varResults
          .filter(r => !sources.some(s => s.url === r.url))
          .slice(0, 3); // Limitar a 3 resultados por portal para manter a velocidade

        return Promise.all(uniqueVarResults.map(async (r) => {
          // Otimização: Usar Promise.race ou timeout para o scrape individual
          const fullContent = await Promise.race([
            contentScraper.scrape(r.url),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 15000)) // Timeout de 15s por página
          ]);

          return {
            title: r.title,
            url: r.url,
            content: fullContent || r.snippet,
            source: r.source,
            publishedAt: r.publishedAt,
            type: 'news' as const,
            confidence: 'high' as const,
            credibilityLayer: 'B' as const
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
              confidence: r.confidence,
              credibilityLayer: r.credibilityLayer
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
