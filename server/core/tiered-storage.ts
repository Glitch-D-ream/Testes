import { logInfo, logError } from './logger.ts';
import { DataCompressor } from './compression.ts';
import { MemoryCache } from './cache-l1.ts';
import { getSupabase } from './database.ts';

/**
 * Gerenciador de Armazenamento em Camadas (Tiered Storage)
 * Hot: Memória (L1)
 * Warm: Supabase (L2) - Comprimido
 * Cold: GitHub (L3) - Para logs e dados históricos (Opcional/Futuro)
 */
export class TieredStorage {
  /**
   * Salva dados no sistema de camadas
   */
  static async store(key: string, data: any, accessPattern: 'hot' | 'warm' = 'hot'): Promise<void> {
    const stringData = JSON.stringify(data);
    
    if (accessPattern === 'hot') {
      // Salva na memória
      MemoryCache.set(key, stringData);
    }

    // Sempre persiste no Supabase como Warm Storage (Comprimido)
    try {
      const compressed = DataCompressor.compress(data);
      const supabase = getSupabase();
      
      await supabase
        .from('public_data_cache')
        .upsert({
          data_type: 'tiered_storage',
          data_source: key,
          data_content: compressed,
          last_updated: new Date().toISOString()
        }, { onConflict: 'data_type,data_source' });
        
      logInfo(`[TieredStorage] Dados salvos: ${key} (${accessPattern})`);
    } catch (error) {
      logError(`[TieredStorage] Erro ao salvar no Supabase: ${key}`, error as Error);
    }
  }

  /**
   * Recupera dados do sistema de camadas
   */
  static async retrieve<T>(key: string): Promise<T | null> {
    // 1. Tenta Hot Storage (Memória)
    const cached = MemoryCache.get<string>(key);
    if (cached) {
      logInfo(`[TieredStorage] Hot Hit: ${key}`);
      return JSON.parse(cached) as T;
    }

    // 2. Tenta Warm Storage (Supabase)
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('public_data_cache')
        .select('data_content')
        .eq('data_type', 'tiered_storage')
        .eq('data_source', key)
        .single();

      if (error || !data) return null;

      const decompressed = DataCompressor.decompress(data.data_content as string);
      
      // Sincroniza com Hot Storage para próxima vez
      MemoryCache.set(key, JSON.stringify(decompressed));
      
      logInfo(`[TieredStorage] Warm Hit: ${key}`);
      return decompressed as T;
    } catch (error) {
      logError(`[TieredStorage] Erro ao recuperar do Supabase: ${key}`, error as Error);
      return null;
    }
  }
}
