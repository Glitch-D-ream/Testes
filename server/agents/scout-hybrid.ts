/**
 * Scout Agent Híbrido v2.0
 * Prioriza: APIs Oficiais -> Scraping Direto -> IA (Fallback)
 * Isso garante URLs reais sem depender de limites de taxa de IA.
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { multiScoutAgent } from './multi-scout.ts';

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

    // FASE 1: Buscar em Fontes Oficiais (Câmara, Senado, TSE)
    logInfo(`[ScoutHybrid] FASE 1: Buscando em fontes oficiais...`);
    const officialResults = await officialSourcesSearch.search(query);
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

    // FASE 2: Busca Direta via Scraping (DuckDuckGo/Google)
    if (sources.length < 5 || deepSearch) {
      logInfo(`[ScoutHybrid] FASE 2: Buscando via scraping direto...`);
      const directResults = await directSearchImproved.search(query);
      
      directResults.forEach(r => {
        if (!sources.some(s => s.url === r.url)) {
          sources.push({
            title: r.title,
            url: r.url,
            content: r.snippet,
            source: r.source,
            publishedAt: r.publishedAt,
            type: 'news',
            confidence: this.whitelist.some(d => r.url.includes(d)) ? 'high' : 'medium'
          });
        }
      });
      logInfo(`[ScoutHybrid] Scraping direto encontrou: ${directResults.length}`);
    }

    // FASE 3: Deep Search com variações de query focadas em portais de elite
    if (sources.length < 5 && deepSearch) {
      logInfo(`[ScoutHybrid] FASE 3: Deep Search em portais de elite...`);
      const elitePortals = ['g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'poder360.com.br'];
      
      for (const portal of elitePortals) {
        const eliteQuery = `site:${portal} ${query} promessa OR anunciou OR projeto`;
        const varResults = await directSearchImproved.search(eliteQuery);
        
        varResults.forEach(r => {
          if (!sources.some(s => s.url === r.url)) {
            sources.push({
              title: r.title,
              url: r.url,
              content: r.snippet,
              source: r.source,
              publishedAt: r.publishedAt,
              type: 'news',
              confidence: 'high'
            });
          }
        });
        if (sources.length >= 10) break;
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
