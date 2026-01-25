import { SmartScout } from './smartScout.ts';

export class ScoutAgent {
  private scout: SmartScout;
  private politicianCache = new Map<string, {timestamp: number, data: any}>();
  
  constructor() {
    this.scout = new SmartScout({
      maxResultsPerSource: 15,
      timeoutMs: 15000,
      useCache: true,
      cacheTtlHours: 12,
      prioritizeOfficialSources: true
    });
  }
  
  async execute(query: string): Promise<any> {
    console.log(`🚀 ScoutAgent iniciando busca para: ${query}`);
    
    // Verifica cache em memória (5 minutos)
    const memoryCache = this.politicianCache.get(query);
    if (memoryCache && Date.now() - memoryCache.timestamp < 300000) {
      console.log(`⚡ Cache memória hit para: ${query}`);
      return memoryCache.data;
    }
    
    // Executa busca com SmartScout
    const results = await this.scout.searchPolitician(query);
    
    // Formata para o padrão da Tríade
    const formattedResults = this.formatForTriade(results, query);
    
    // Atualiza cache em memória
    this.politicianCache.set(query, {
      timestamp: Date.now(),
      data: formattedResults
    });
    
    // Limpa cache antigo
    this.cleanupMemoryCache();
    
    return formattedResults;
  }
  
  private formatForTriade(results: any[], query: string): any {
    return {
      query,
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      results: results.map(r => ({
        type: 'news',
        title: r.title,
        content: r.content,
        url: r.url,
        source: r.source,
        date: r.date,
        metadata: {
          politician_name: r.politician_name,
          category: r.category,
          relevance: r.relevance
        }
      })),
      metadata: {
        sourcesUsed: [...new Set(results.map(r => r.source))],
        cacheStats: this.scout.getCacheStats(),
        successRate: results.length > 0 ? 'high' : 'low'
      }
    };
  }
  
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.politicianCache.entries()) {
      if (now - value.timestamp > 300000) { // 5 minutos
        this.politicianCache.delete(key);
      }
    }
  }
  
  async getDiagnostics() {
    return {
      cacheStats: this.scout.getCacheStats(),
      sourceStats: await this.scout.getSourceStats(),
      memoryCacheSize: this.politicianCache.size
    };
  }
}
