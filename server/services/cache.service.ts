import { getSupabase } from '../core/database.js';
import { logInfo, logWarn } from '../core/logger.js';

export interface CachedAnalysis {
  id: string;
  politicianName: string;
  analysisData: any;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
}

/**
 * Cache Service: Armazena análises no Supabase para reutilização
 * Reduz chamadas a APIs e acelera o sistema
 */
export class CacheService {
  private readonly CACHE_TTL_DAYS = 7; // Tempo de vida do cache: 7 dias

  /**
   * Buscar análise em cache
   */
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

      if (error || !data) {
        logWarn(`[Cache] Análise não encontrada ou expirada para: ${politicianName}`);
        return null;
      }

      // Incrementar contador de hits
      await supabase
        .from('analysis_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('id', data.id)
        .catch(() => {});

      logInfo(`[Cache] Análise encontrada em cache para: ${politicianName} (Hits: ${data.hit_count + 1})`);
      return data.analysis_data;
    } catch (error) {
      logWarn(`[Cache] Erro ao buscar análise em cache`, error as Error);
      return null;
    }
  }

  /**
   * Salvar análise em cache
   */
  async saveAnalysis(politicianName: string, analysisData: any): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

      // Primeiro, tentar deletar análise antiga se existir
      await supabase
        .from('analysis_cache')
        .delete()
        .eq('politician_name', politicianName)
        .catch(() => {});

      // Depois, inserir nova análise
      const { error } = await supabase
        .from('analysis_cache')
        .insert({
          politician_name: politicianName,
          analysis_data: analysisData,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          hit_count: 0
        });

      if (error) {
        logWarn(`[Cache] Erro ao salvar análise em cache`, error);
        return false;
      }

      logInfo(`[Cache] Análise salva em cache para: ${politicianName} (Expira em: ${expiresAt.toISOString()})`);
      return true;
    } catch (error) {
      logWarn(`[Cache] Erro ao salvar análise em cache`, error as Error);
      return false;
    }
  }

  /**
   * Limpar cache expirado
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('analysis_cache')
        .delete()
        .lt('expires_at', now)
        .select();

      if (error) {
        logWarn(`[Cache] Erro ao limpar cache expirado`, error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      logInfo(`[Cache] ${deletedCount} análises expiradas removidas do cache`);
      return deletedCount;
    } catch (error) {
      logWarn(`[Cache] Erro ao limpar cache expirado`, error as Error);
      return 0;
    }
  }

  /**
   * Obter estatísticas de cache
   */
  async getStats(): Promise<{ totalCached: number; totalHits: number; avgHitsPerAnalysis: number }> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('analysis_cache')
        .select('hit_count');

      if (error || !data) {
        return { totalCached: 0, totalHits: 0, avgHitsPerAnalysis: 0 };
      }

      const totalCached = data.length;
      const totalHits = data.reduce((sum, item) => sum + (item.hit_count || 0), 0);
      const avgHitsPerAnalysis = totalCached > 0 ? totalHits / totalCached : 0;

      return { totalCached, totalHits, avgHitsPerAnalysis };
    } catch (error) {
      logWarn(`[Cache] Erro ao obter estatísticas de cache`, error as Error);
      return { totalCached: 0, totalHits: 0, avgHitsPerAnalysis: 0 };
    }
  }
}

export const cacheService = new CacheService();
