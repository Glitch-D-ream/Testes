import { getSupabase } from '../core/database.ts';
import { logInfo, logWarn } from '../core/logger.ts';

export interface CachedAnalysis {
  id: string;
  politicianName: string;
  analysisData: any;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
}

/**
 * Cache Service: Armazena análises e dados governamentais no Supabase
 */
export class CacheService {
  private readonly CACHE_TTL_DAYS = 7;

  async getAnalysis(politicianName: string): Promise<any | null> {
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('*')
        .eq('politician_name', politicianName)
        .gt('expires_at', now)
        .single();
      if (error || !data) return null;
      return data.analysis_data;
    } catch (error) {
      return null;
    }
  }

  async saveAnalysis(politicianName: string, analysisData: any): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const expiresAt = new Date(Date.now() + this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('analysis_cache').upsert({
        politician_name: politicianName,
        analysis_data: analysisData,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'politician_name' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Buscar dados genéricos em cache (SICONFI, Câmara, Senado)
   */
  async getGenericData<T>(key: string): Promise<T | null> {
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('public_data_cache')
        .select('data_content, expiry_date')
        .eq('data_source', key)
        .gt('expiry_date', now)
        .maybeSingle();
      if (error || !data) return null;
      return data.data_content as T;
    } catch (error) {
      logWarn(`[Cache] Erro ao buscar dado genérico: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Salvar dados genéricos em cache
   */
  async saveGenericData(key: string, source: string, data: any, ttlDays: number = 7): Promise<void> {
    try {
      const supabase = getSupabase();
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('public_data_cache')
        .select('id')
        .eq('data_source', key)
        .maybeSingle();

      if (existing) {
        await supabase.from('public_data_cache').update({
          data_content: data,
          expiry_date: expiresAt,
          last_updated: new Date().toISOString()
        }).eq('id', existing.id);
      } else {
        await supabase.from('public_data_cache').insert({
          id: Math.random().toString(36).substring(7),
          data_type: source,
          data_source: key,
          data_content: data,
          expiry_date: expiresAt
        });
      }
      logInfo(`[Cache] Dado governamental cacheado: ${key} (${source})`);
    } catch (error) {
      logWarn(`[Cache] Erro ao salvar dado genérico: ${key}`, error as Error);
    }
  }
}

export const cacheService = new CacheService();
