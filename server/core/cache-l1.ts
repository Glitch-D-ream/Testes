import { logInfo } from './logger.ts';

interface CacheItem<T> {
  data: T;
  expiry: number;
}

/**
 * Sistema de Cache L1 (In-Memory) com TTL (Time To Live).
 * Reduz a latência para dados acessados frequentemente e economiza recursos do Railway/Supabase.
 */
export class MemoryCache {
  private static cache = new Map<string, CacheItem<any>>();
  private static readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hora
  private static readonly MAX_ITEMS = 500; // Limite para evitar estouro de memória

  /**
   * Armazena um item no cache.
   */
  static set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    // Gerenciamento de tamanho do cache (LRU simplificado)
    if (this.cache.size >= this.MAX_ITEMS) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Recupera um item do cache.
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Remove um item específico ou limpa todo o cache.
   */
  static delete(key: string): void {
    this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
    logInfo('[Cache-L1] Cache em memória limpo.');
  }

  /**
   * Retorna estatísticas básicas do cache.
   */
  static getStats() {
    return {
      size: this.cache.size,
      maxItems: this.MAX_ITEMS
    };
  }
}
