import { z } from 'zod';
import { createHash } from 'crypto';
import { supabase } from '../core/database.ts';

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
   * Busca principal por um político
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
    
    // Verifica cache se configurado
    if (this.config.useCache && !options?.forceRefresh) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        this.cacheHits++;
        return cached;
      }
      this.cacheMisses++;
    }

    console.log(`🔍 Buscando dados para: ${politicianName}`);
    
    // Estratégia de busca em cascata
    const allResults: SearchResult[] = [];
    
    try {
      // Fase 1: Fontes governamentais (mais confiáveis)
      const govResults = await this.searchGovernmentSources(politicianName, options);
      allResults.push(...govResults);
      
      // Fase 2: Dados abertos e institucionais (só se necessário)
      if (allResults.length < 5) {
        const instResults = await this.searchInstitutionalSources(politicianName, options);
        allResults.push(...instResults);
      }
      
      // Fase 3: Mídia confiável (apenas se ainda precisa)
      if (allResults.length < 3) {
        const mediaResults = await this.searchReliableMedia(politicianName, options);
        allResults.push(...mediaResults);
      }
      
      // Remove duplicatas e ordena por relevância
      const uniqueResults = this.deduplicateResults(allResults);
      const sortedResults = uniqueResults.sort((a, b) => b.relevance - a.relevance);
      
      // Armazena em cache
      if (this.config.useCache) {
        await this.storeInCache(cacheKey, sortedResults);
      }
      
      // Atualiza estatísticas da fonte
      await this.updateSourceStats(sortedResults);
      
      console.log(`✅ Encontrados ${sortedResults.length} resultados para ${politicianName}`);
      return sortedResults;
      
    } catch (error: any) {
      console.error(`❌ Erro na busca por ${politicianName}:`, error);
      
      // Tenta retornar cache mesmo expirado em caso de erro
      const staleCache = await this.getFromCache(cacheKey, true);
      if (staleCache) {
        console.log(`⚠️ Retornando cache expirado como fallback`);
        return staleCache;
      }
      
      throw new Error(`Falha na busca: ${error.message}`);
    }
  }

  /**
   * Busca em fontes governamentais oficiais
   */
  private async searchGovernmentSources(
    politicianName: string,
    options?: any
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), this.config.timeoutMs);

    try {
      // 1. API da Câmara dos Deputados
      const camaraResults = await this.searchCamaraAPI(politicianName, options);
      results.push(...camaraResults);
      
      // 2. API do Senado Federal
      const senadoResults = await this.searchSenadoAPI(politicianName, options);
      results.push(...senadoResults);
      
      // 3. Portal da Transparência
      const transparenciaResults = await this.searchPortalTransparencia(politicianName, options);
      results.push(...transparenciaResults);
      
      // 4. Diário Oficial da União
      const douResults = await this.searchDiarioOficial(politicianName, options);
      results.push(...douResults);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⌛ Timeout em fontes governamentais');
      } else {
        console.warn('⚠️ Erro em fonte governamental:', error.message);
      }
    } finally {
      clearTimeout(timeoutId);
    }
    
    return results;
  }

  /**
   * API da Câmara dos Deputados
   */
  private async searchCamaraAPI(politicianName: string, options?: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Endpoints da API de Dados Abertos
      const endpoints = [
        `https://dadosabertos.camara.leg.br/api/v2/deputados?nome=${encodeURIComponent(politicianName)}`,
        `https://dadosabertos.camara.leg.br/api/v2/proposicoes?autor=${encodeURIComponent(politicianName)}&itens=10`,
        `https://dadosabertos.camara.leg.br/api/v2/discursos?autor=${encodeURIComponent(politicianName)}&itens=10`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: { 'Accept': 'application/json' }
          });
          
          if (!response.ok) continue;
          
          const data: any = await response.json();
          
          if (data.dados && Array.isArray(data.dados)) {
            for (const item of data.dados) {
              const result = await this.normalizeCamaraData(item, politicianName);
              if (result) results.push(result);
            }
          }
        } catch (e) {}
      }
      
    } catch (error: any) {
      console.warn('API Câmara indisponível:', error.message);
    }
    
    return results;
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
        // É um deputado
        title = `Perfil: ${item.nome}`;
        content = `Deputado ${item.siglaPartido}-${item.siglaUf}. Email: ${item.email}`;
        category = 'profile';
      } else if (item.ementa) {
        // É uma proposição
        title = item.ementa;
        content = `Tipo: ${item.siglaTipo} ${item.numero}/${item.ano}. Situação: ${item.statusProposicao?.descricaoSituacao || 'N/A'}`;
        category = 'project';
      } else if (item.texto) {
        // É um discurso
        title = 'Discurso na Câmara';
        content = item.texto.substring(0, 500) + (item.texto.length > 500 ? '...' : '');
        category = 'speech';
      } else {
        return null;
      }
      
      return {
        id: `camara-${item.id || item.codigo || Date.now()}`,
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
   * API do Senado Federal
   */
  private async searchSenadoAPI(politicianName: string, options?: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Busca por senadores
      const response = await fetch(
        `https://legis.senado.leg.br/dadosabertos/senador/lista/atual`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data: any = await response.json();
        const senators = data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
        
        if (Array.isArray(senators)) {
          const matchingSenator = senators.find((s: any) =>
            s.IdentificacaoParlamentar.NomeParlamentar.toLowerCase().includes(politicianName.toLowerCase()) ||
            s.IdentificacaoParlamentar.NomeCompleto.toLowerCase().includes(politicianName.toLowerCase())
          );
          
          if (matchingSenator) {
            results.push({
              id: `senado-${matchingSenator.IdentificacaoParlamentar.CodigoParlamentar}`,
              title: `Senador ${matchingSenator.IdentificacaoParlamentar.NomeParlamentar}`,
              content: `Partido: ${matchingSenator.IdentificacaoParlamentar.SiglaPartido}. Estado: ${matchingSenator.IdentificacaoParlamentar.UfParlamentar}`,
              url: `https://www25.senado.leg.br/web/senadores/${matchingSenator.IdentificacaoParlamentar.CodigoParlamentar}`,
              source: 'government',
              date: new Date().toISOString(),
              relevance: 0.9,
              politician_name: politicianName,
              politician_role: `Senador ${matchingSenator.IdentificacaoParlamentar.SiglaPartido}-${matchingSenator.IdentificacaoParlamentar.UfParlamentar}`,
              category: 'profile',
              raw_data: matchingSenator
            });
          }
        }
      }
    } catch (error: any) {
      console.warn('API Senado indisponível:', error.message);
    }
    
    return results;
  }

  /**
   * Portal da Transparência (Simulado ou via API se disponível)
   */
  private async searchPortalTransparencia(politicianName: string, options?: any): Promise<SearchResult[]> {
    // Implementação simplificada para o exemplo
    return [];
  }

  /**
   * Diário Oficial da União (Simulado ou via API se disponível)
   */
  private async searchDiarioOficial(politicianName: string, options?: any): Promise<SearchResult[]> {
    // Implementação simplificada para o exemplo
    return [];
  }

  /**
   * Busca em fontes institucionais e dados abertos
   */
  private async searchInstitutionalSources(politicianName: string, options?: any): Promise<SearchResult[]> {
    // Implementação simplificada para o exemplo
    return [];
  }

  /**
   * Busca em mídia confiável via RSS
   */
  private async searchReliableMedia(politicianName: string, options?: any): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const feeds = [
      'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml',
      'https://feeds.folha.uol.com.br/poder/rss091.xml',
      'https://g1.globo.com/rss/g1/politica/'
    ];

    for (const feedUrl of feeds) {
      try {
        const response = await fetch(feedUrl);
        if (!response.ok) continue;
        const xml = await response.text();
        const items = this.extractRSSItems(xml);
        
        for (const item of items) {
          if (item.title.toLowerCase().includes(politicianName.toLowerCase()) || 
              item.description.toLowerCase().includes(politicianName.toLowerCase())) {
            results.push({
              id: `rss-${createHash('md5').update(item.link).digest('hex')}`,
              title: item.title,
              content: item.description,
              url: item.link,
              source: 'media',
              date: item.pubDate || new Date().toISOString(),
              relevance: this.calculateTextRelevance(item.description, politicianName),
              politician_name: politicianName,
              category: 'news',
              raw_data: item
            });
          }
        }
      } catch (e) {}
    }
    
    return results;
  }

  /**
   * Extrai itens de RSS (simplificado)
   */
  private extractRSSItems(xmlContent: string): Array<{title: string; description: string; link: string; pubDate?: string}> {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlContent)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const descriptionMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: this.cleanText(titleMatch[1]),
          description: descriptionMatch ? this.cleanText(descriptionMatch[1]) : '',
          link: this.cleanText(linkMatch[1]),
          pubDate: pubDateMatch ? this.cleanText(pubDateMatch[1]) : undefined
        });
      }
    }
    
    return items;
  }

  /**
   * Sistema de cache inteligente
   */
  private async getFromCache(cacheKey: string, allowStale = false): Promise<SearchResult[] | null> {
    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('scout_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .maybeSingle();
      
      if (error || !data) return null;
      
      const cacheAge = Date.now() - new Date(data.updated_at).getTime();
      const maxAge = allowStale ? this.config.cacheTtlHours * 2 * 3600000 : 
                                  this.config.cacheTtlHours * 3600000;
      
      if (cacheAge < maxAge) {
        return data.results;
      }
      
      // Cache expirado, remove
      await supabase.from('scout_cache').delete().eq('cache_key', cacheKey);
      return null;
      
    } catch (error: any) {
      console.warn('Erro ao acessar cache:', error.message);
      return null;
    }
  }

  private async storeInCache(cacheKey: string, results: SearchResult[]): Promise<void> {
    try {
      if (!supabase) return;
      await supabase.from('scout_cache').upsert({
        cache_key: cacheKey,
        results,
        updated_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });
    } catch (error: any) {
      console.warn('Erro ao salvar cache:', error.message);
    }
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
    
    // Aumenta relevância se contém o nome exato
    if (JSON.stringify(data).toLowerCase().includes(politicianName.toLowerCase())) {
      relevance += 0.2;
    }
    
    // Aumenta se for recente (últimos 30 dias)
    if (data.dataHora) {
      const date = new Date(data.dataHora);
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 3600 * 24);
      if (daysAgo < 30) relevance += 0.15;
      if (daysAgo < 7) relevance += 0.1;
    }
    
    // Aumenta se for de fonte governamental
    if (data.uri && data.uri.includes('camara.leg.br')) {
      relevance += 0.1;
    }
    
    return Math.min(relevance, 1.0);
  }

  private calculateTextRelevance(text: string, politicianName: string): number {
    const lowerText = text.toLowerCase();
    const lowerName = politicianName.toLowerCase();
    
    let relevance = 0.3;
    
    // Verifica ocorrências do nome
    const nameOccurrences = (lowerText.match(new RegExp(lowerName, 'g')) || []).length;
    relevance += Math.min(nameOccurrences * 0.1, 0.3);
    
    // Verifica palavras-chave importantes
    const keywords = ['promete', 'compromisso', 'orçamento', 'projeto', 'lei', 'votação'];
    const foundKeywords = keywords.filter(kw => lowerText.includes(kw)).length;
    relevance += Math.min(foundKeywords * 0.05, 0.2);
    
    // Penaliza textos muito curtos
    if (text.length < 100) relevance *= 0.8;
    
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

  private async updateSourceStats(results: SearchResult[]): Promise<void> {
    try {
      if (!supabase) return;
      const sourceCounts: Record<string, number> = {};
      
      for (const result of results) {
        const domain = new URL(result.url).hostname;
        sourceCounts[domain] = (sourceCounts[domain] || 0) + 1;
      }
      
      // Atualiza estatísticas no banco
      for (const [domain, count] of Object.entries(sourceCounts)) {
        await supabase
          .from('source_statistics')
          .upsert({
            domain,
            success_count: count,
            last_success: new Date().toISOString()
          }, { onConflict: 'domain' });
      }
    } catch (error) {
      // Ignora erros nas estatísticas
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove tags HTML
      .replace(/&[a-z]+;/g, '') // Remove entidades HTML
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Métodos públicos para monitoramento
   */
  public getCacheStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  public async getSourceStats() {
    if (!supabase) return [];
    const { data } = await supabase
      .from('source_statistics')
      .select('*')
      .order('success_count', { ascending: false })
      .limit(10);
    
    return data || [];
  }

  public async clearCache(): Promise<void> {
    if (!supabase) return;
    await supabase.from('scout_cache').delete().neq('cache_key', '');
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
