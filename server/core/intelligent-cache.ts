
import { logInfo, logWarn } from './logger.ts';
import { getSupabase } from './database.ts';

/**
 * IntelligentCache - Sistema de cache em camadas (L1: Memória, L3: Supabase)
 * Otimiza o tempo de resposta e reduz chamadas a APIs externas.
 */
export class IntelligentCache {
  // L1: Cache em memória (TTL curto)
  private static l1 = new Map<string, { data: any; expires: number }>();
  private static readonly L1_TTL = 10 * 60 * 1000; // 10 minutos

  /**
   * Obtém um item do cache ou executa a função de busca
   */
  static async get<T>(key: string, fetchFn: () => Promise<T>, ttlOverride?: number): Promise<T> {
    const now = Date.now();

    // 1. Tentar L1 (Memória)
    const cachedL1 = this.l1.get(key);
    if (cachedL1 && cachedL1.expires > now) {
      logInfo(`[Cache] L1 Hit: ${key}`);
      return cachedL1.data as T;
    }

    // 2. Tentar L3 (Supabase - Tabela de Cache)
    try {
      const supabase = getSupabase();
      // Tentar data_snapshots primeiro
      const { data: cachedL3, error } = await supabase
        .from('data_snapshots')
        .select('payload, created_at')
        .eq('data_source', `cache:${key}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedL3 && !error) {
        const createdAt = new Date(cachedL3.created_at).getTime();
        const ttl = ttlOverride || 24 * 60 * 60 * 1000; 

        if (now - createdAt < ttl) {
          logInfo(`[Cache] L3 Hit (data_snapshots): ${key}`);
          this.l1.set(key, { data: cachedL3.payload, expires: now + this.L1_TTL });
          return cachedL3.payload as T;
        }
      }

      // Fallback para scout_history se for uma busca de político
      if (key.startsWith('search:')) {
        const { data: scoutData, error: scoutError } = await supabase
          .from('scout_history')
          .select('title, url, content, source, published_at')
          .ilike('politician_name', `%${key.split(':').pop()}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (scoutData && scoutData.length > 0 && !scoutError) {
          logInfo(`[Cache] L3 Hit (scout_history): ${key}`);
          const formattedData = scoutData.map(d => ({
            title: d.title,
            url: d.url,
            content: d.content,
            source: d.source,
            publishedAt: d.published_at,
            type: 'news',
            confidence: 'medium',
            credibilityLayer: 'B'
          }));
          this.l1.set(key, { data: formattedData, expires: now + this.L1_TTL });
          return formattedData as any as T;
        }
      }
    } catch (e) {
      logWarn(`[Cache] Erro ao acessar L3: ${(e as Error).message}`);
    }

    // 3. Cache Miss: Executar função original
    logInfo(`[Cache] Miss: ${key}. Buscando dados frescos...`);
    const freshData = await fetchFn();

    // 4. Salvar em L1 e L3
    this.set(key, freshData);

    return freshData;
  }

  /**
   * Salva dados no cache (L1 e L3)
   */
  static async set(key: string, data: any): Promise<void> {
    const now = Date.now();

    // Salvar em L1
    this.l1.set(key, { data, expires: now + this.L1_TTL });

    // Salvar em L3 (Supabase) de forma assíncrona (fire and forget)
    try {
      const supabase = getSupabase();
      // Tentar persistir em data_snapshots silenciosamente
      supabase.from('data_snapshots').insert({
        data_source: `cache:${key}`,
        data_type: 'CACHE',
        payload: data,
        version: 1
      }).then(({ error }) => {
        // Silenciar erro de tabela inexistente para não poluir logs
        if (error && !error.message.includes('data_snapshots')) {
          logWarn(`[Cache] Erro ao persistir em L3: ${error.message}`);
        }
      });
    } catch (e) {
      // Silenciar erros de inicialização
    }
  }

  /**
   * Limpa o cache L1
   */
  static clearL1(): void {
    this.l1.clear();
    logInfo('[Cache] L1 limpo com sucesso.');
  }
}
