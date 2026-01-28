import { z } from 'zod';
import { createHash } from 'crypto';
import { supabase } from '../core/database.ts';
import { supabaseCircuitBreaker } from '../core/circuitBreaker.ts';
import { localCache } from '../core/localCache.ts';
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { 
  scoutSourceLatency, 
  scoutSourceErrors, 
  scoutCircuitBreakerState,
  cacheHits,
  cacheMisses
} from '../core/observability.ts';

// Schemas de validação
const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().url(),
  source: z.enum(['government', 'media', 'academic', 'institutional']),
  date: z.string().datetime(),
  relevance: z.number().min(0).max(1),
  politician_name: z.string(),
  politician_role: z.string().optional(),
  category: z.enum(['speech', 'project', 'budget', 'news', 'academic', 'profile']),
  raw_data: z.any()
});

const ScoutConfigSchema = z.object({
  maxResultsPerSource: z.number().default(10),
  timeoutMs: z.number().default(10000),
  useCache: z.boolean().default(true),
  cacheTtlHours: z.number().default(24),
  prioritizeOfficialSources: z.boolean().default(true)
});

type SearchResult = z.infer<typeof SearchResultSchema>;
type ScoutConfig = z.infer<typeof ScoutConfigSchema>;

export class SmartScout {
  private config: ScoutConfig;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(config?: Partial<ScoutConfig>) {
    this.config = ScoutConfigSchema.parse(config || {});
  }

  /**
   * Busca principal por um político (Versão Minimalista)
   */
  async searchPolitician(
    politicianName: string,
    options?: {
      forceRefresh?: boolean;
      categories?: string[];
      dateRange?: { start: string; end: string };
    }
  ): Promise<SearchResult[]> {
    const cacheKey = this.generateCacheKey(politicianName, options);
    
    // 1. Verifica cache (Supabase)
    if (this.config.useCache && !options?.forceRefresh) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        this.cacheHits++;
        cacheHits.inc({ cache_name: 'supabase' });
        return cached;
      }
      this.cacheMisses++;
      cacheMisses.inc({ cache_name: 'supabase' });
    }

    logInfo(`[SmartScout] Buscando dados para: ${politicianName}`);
    
    const allResults: SearchResult[] = [];
    
    try {
      // Fase 1: API da Câmara (Fonte Governamental Principal)
      const camaraStart = Date.now();
      const camaraResults = await this.searchCamaraAPI(politicianName, options);
      scoutSourceLatency.observe({ source: 'camara' }, (Date.now() - camaraStart) / 1000);
      allResults.push(...camaraResults);
      
      // Fase 2: Google Custom Search (Notícias e Outros)
      if (allResults.length < 5) {
        const googleStart = Date.now();
        const googleResults = await this.searchGoogleAPI(politicianName, options);
        scoutSourceLatency.observe({ source: 'google' }, (Date.now() - googleStart) / 1000);
        allResults.push(...googleResults);
      }
      
      // Processamento final
      const uniqueResults = this.deduplicateResults(allResults);
      const sortedResults = uniqueResults.sort((a, b) => b.relevance - a.relevance);
      
      // Armazena em cache
      if (this.config.useCache && sortedResults.length > 0) {
        await this.storeInCache(cacheKey, sortedResults);
      }
      
      logInfo(`[SmartScout] Encontrados ${sortedResults.length} resultados para ${politicianName}`);
      return sortedResults;
      
    } catch (error: any) {
      logError(`[SmartScout] Erro na busca por ${politicianName}:`, error);
      
      // Fallback para cache expirado
      const staleCache = await this.getFromCache(cacheKey, true);
      if (staleCache) {
        logWarn(`[SmartScout] Retornando cache expirado como fallback`);
        return staleCache;
      }
      
      return [];
    }
  }

  /**
   * Validação de Identidade (Anti-Ambiguidade)
   */
  private validateIdentity(foundName: string, searchedName: string): boolean {
    const found = foundName.toLowerCase();
    const searched = searchedName.toLowerCase();
    
    // 1. Match Exato
    if (found === searched) return true;
    
    // 2. Casos Especiais de Alto Perfil (Hardcoded para segurança)
    const highProfile = {
      'lula': 'luiz inácio lula da silva',
      'bolsonaro': 'jair messias bolsonaro',
      'tarcisio': 'tarcísio gomes de freitas',
      'haddad': 'fernando haddad'
    };
    
    if (highProfile[searched as keyof typeof highProfile] === found) return true;
    
    // 3. Bloqueio de Falsos Positivos Comuns (Ex: Lula da Fonte para Lula)
    if (searched === 'lula' && found.includes('fonte')) return false;
    
    // 4. Verificação de Substring (Deve ser o nome principal, não apenas parte do sobrenome)
    const foundParts = found.split(' ');
    const searchedParts = searched.split(' ');
    
    // Se o nome buscado for apenas uma palavra, ela deve ser uma das partes do nome encontrado
    // mas não pode ser apenas um sobrenome comum se houver ambiguidade
    return searchedParts.every(part => foundParts.includes(part));
  }

  /**
   * API da Câmara dos Deputados
   */
  private async searchCamaraAPI(politicianName: string, options?: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      // 1. Primeiro, validar se o político existe e pegar o nome oficial
      const searchUrl = `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(politicianName)}&ordem=ASC&ordenarBy=nome`;
      const searchRes = await fetch(searchUrl, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
      
      let officialName = politicianName;
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        if (searchData.dados && searchData.dados.length > 0) {
          // Filtrar por validação de identidade
          const validPoliticians = searchData.dados.filter((p: any) => this.validateIdentity(p.nome, politicianName));
          
          if (validPoliticians.length > 0) {
            officialName = validPoliticians[0].nome;
            logInfo(`[SmartScout] Identidade validada: ${politicianName} -> ${officialName}`);
          } else if (searchData.dados.length > 1) {
            logWarn(`[SmartScout] Ambiguidade detectada para \"${politicianName}\". Resultados podem ser imprecisos.`);         }
        }
      }

      const endpoints = [
        `https://dadosabertos.camara.leg.br/api/v2/proposicoes?autor=${encodeURIComponent(officialName)}&itens=5`,
        `https://dadosabertos.camara.leg.br/api/v2/discursos?autor=${encodeURIComponent(officialName)}&itens=5`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          
          if (!response.ok) continue;
          
          const data: any = await response.json();
          
          if (data.dados && Array.isArray(data.dados)) {
            for (const item of data.dados) {
              const result = await this.normalizeCamaraData(item, officialName);
              if (result) results.push(result);
            }
          }
        } catch (e) {
          // Erro individual
        }
      }
    } catch (error: any) {
      logWarn('[SmartScout] API Câmara indisponível ou timeout');
    } finally {
      clearTimeout(timeoutId);
    }
    
    return results;
  }

  /**
   * Google Custom Search API (Placeholder para implementação futura)
   */
  private async searchGoogleAPI(politicianName: string, options?: any): Promise<SearchResult[]> {
    // Por enquanto, retorna vazio até que as chaves sejam configuradas
    // No futuro, usará process.env.GOOGLE_CSE_KEY e process.env.GOOGLE_CX_ID
    return [];
  }

  /**
   * Normaliza dados da Câmara
   */
  private async normalizeCamaraData(item: any, politicianName: string): Promise<SearchResult | null> {
    try {
      let title = '';
      let content = '';
      let category: any = 'speech';
      
      if (item.nome) {
        title = `Perfil: ${item.nome}`;
        content = `Deputado ${item.siglaPartido}-${item.siglaUf}. Email: ${item.email}`;
        category = 'profile';
      } else if (item.ementa) {
        title = item.ementa;
        content = `Tipo: ${item.siglaTipo} ${item.numero}/${item.ano}. Situação: ${item.statusProposicao?.descricaoSituacao || 'N/A'}`;
        category = 'project';
      } else if (item.texto) {
        title = 'Discurso na Câmara';
        content = item.texto.substring(0, 500) + (item.texto.length > 500 ? '...' : '');
        category = 'speech';
      } else {
        return null;
      }
      
      return {
        id: `camara-${item.id || item.codigo || Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        url: item.uri || item.link || `https://www.camara.leg.br/deputados/${item.id}`,
        source: 'government',
        date: item.dataHora || item.ultimoStatus?.data || new Date().toISOString(),
        relevance: this.calculateRelevance(item, politicianName),
        politician_name: politicianName,
        politician_role: item.siglaPartido ? `Deputado ${item.siglaPartido}-${item.siglaUf}` : 'Político',
        category,
        raw_data: item
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Sistema de cache com Circuit Breaker e Fallback Local
   */
  private async getFromCache(cacheKey: string, allowStale = false): Promise<SearchResult[] | null> {
    // Atualiza estado do Circuit Breaker nas métricas
    scoutCircuitBreakerState.set({ resource: 'supabase' }, supabaseCircuitBreaker.getState());

    return supabaseCircuitBreaker.execute(
      async () => {
        const { data, error } = await supabase
          .from('scout_cache')
          .select('*')
          .eq('cache_key', cacheKey)
          .maybeSingle();
        
        if (error) {
          scoutSourceErrors.inc({ source: 'supabase' });
          throw error;
        }
        if (!data) return null;
        
        const cacheAge = Date.now() - new Date(data.updated_at).getTime();
        const maxAge = allowStale ? this.config.cacheTtlHours * 2 * 3600000 : 
                                    this.config.cacheTtlHours * 3600000;
        
        if (cacheAge < maxAge) {
          return data.results;
        }
        return null;
      },
      async () => {
        logInfo('[SmartScout] Usando cache local como fallback');
        return localCache.get(cacheKey);
      }
    );
  }

  private async storeInCache(cacheKey: string, results: SearchResult[]): Promise<void> {
    // Salva no Supabase (com Circuit Breaker)
    await supabaseCircuitBreaker.execute(
      async () => {
        await supabase.from('scout_cache').upsert({
          cache_key: cacheKey,
          results,
          updated_at: new Date().toISOString()
        }, { onConflict: 'cache_key' });
      },
      async () => {
        // Se Supabase falhar, salva apenas localmente
        logInfo('[SmartScout] Salvando apenas no cache local');
      }
    );

    // Sempre salva no cache local para garantir fallback futuro
    await localCache.set(cacheKey, results);
  }

  /**
   * Utilitários
   */
  private generateCacheKey(politicianName: string, options?: any): string {
    const keyData = {
      name: politicianName,
      categories: options?.categories || [],
      dateRange: options?.dateRange || {}
    };
    return createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  private calculateRelevance(data: any, politicianName: string): number {
    let relevance = 0.5;
    const searchStr = JSON.stringify(data).toLowerCase();
    const nameLower = politicianName.toLowerCase();
    
    if (searchStr.includes(nameLower)) relevance += 0.2;
    
    if (data.dataHora || data.ultimoStatus?.data) {
      const date = new Date(data.dataHora || data.ultimoStatus.data);
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 3600 * 24);
      if (daysAgo < 30) relevance += 0.15;
      if (daysAgo < 7) relevance += 0.1;
    }
    
    return Math.min(relevance, 1.0);
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];
    
    for (const result of results) {
      const signature = `${result.url}-${result.title.substring(0, 50)}`;
      if (!seen.has(signature)) {
        seen.add(signature);
        unique.push(result);
      }
    }
    
    return unique;
  }

  public getCacheStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  public async getSourceStats() {
    const { data } = await supabase
      .from('source_statistics')
      .select('*')
      .order('success_count', { ascending: false })
      .limit(10);
    
    return data || [];
  }
}
