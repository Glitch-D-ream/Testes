import { SmartScout } from './smartScout.ts';
import { getSupabase } from '../core/database.ts';

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
    
    // PASSO 1: Validação Canônica (Operação Tapa-Buraco)
    const canonicalPolitician = await this.validateCanonical(query);
    
    if (!canonicalPolitician) {
      console.warn(`⚠️ Político não identificado com clareza na tabela canônica: ${query}`);
      return {
        error: "Político não identificado com clareza. Tente o nome completo (ex: Luiz Inácio Lula da Silva).",
        status: "FAILED_IDENTIFICATION",
        query
      };
    }

    console.log(`✅ Político validado: ${canonicalPolitician.full_name} (${canonicalPolitician.id})`);
    
    // Verifica cache em memória (5 minutos)
    const memoryCache = this.politicianCache.get(canonicalPolitician.id);
    if (memoryCache && Date.now() - memoryCache.timestamp < 300000) {
      console.log(`⚡ Cache memória hit para: ${canonicalPolitician.id}`);
      return memoryCache.data;
    }
    
    // Executa busca com SmartScout usando o nome canônico para maior precisão
    const results = await this.scout.searchPolitician(canonicalPolitician.full_name);
    
    // Formata para o padrão da Tríade
    const formattedResults = this.formatForTriade(results, canonicalPolitician);
    
    // Atualiza cache em memória usando o ID canônico
    this.politicianCache.set(canonicalPolitician.id, {
      timestamp: Date.now(),
      data: formattedResults
    });
    
    // Limpa cache antigo
    this.cleanupMemoryCache();
    
    return formattedResults;
  }

  private async validateCanonical(query: string): Promise<any | null> {
    const supabase = getSupabase();
    
    // Busca exata ou parcial na tabela canônica
    const { data, error } = await supabase
      .from('canonical_politicians')
      .select('*')
      .or(`search_name.ilike.%${query}%,full_name.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }
  
  private formatForTriade(results: any[], politician: any): any {
    return {
      query: politician.search_name,
      politician: {
        id: politician.id,
        full_name: politician.full_name,
        role: politician.official_role,
        party: politician.party,
        state: politician.state
      },
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
          politician_name: politician.full_name, // Usa o nome canônico
          category: r.category,
          relevance: r.relevance
        }
      })),
      metadata: {
        sourcesUsed: [...new Set(results.map(r => r.source))],
        cacheStats: this.scout.getCacheStats(),
        successRate: results.length > 0 ? 'high' : 'low',
        is_canonical: true
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
