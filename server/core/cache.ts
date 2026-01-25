import Redis from 'ioredis';
import { logInfo, logError } from './logger.ts';
import { MemoryCache } from './cache-l1.ts';

const REDIS_URL = process.env.REDIS_URL;

class CacheService {
  private redis: Redis | null = null;

  constructor() {
    if (REDIS_URL && process.env.NODE_ENV !== 'test') {
      try {
        this.redis = new Redis(REDIS_URL, {
          maxRetriesPerRequest: null,
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        this.redis.on('error', (err) => {
          logError('Erro na conexão com Redis', err);
        });

        this.redis.on('connect', () => {
          logInfo('Conectado ao Redis com sucesso');
        });
      } catch (err) {
        logError('Falha ao inicializar cliente Redis', err as Error);
      }
    } else {
      logInfo('[CacheService] Redis não configurado. Operando apenas com Cache L1 (Memória).');
    }
  }

  async get(key: string): Promise<string | null> {
    // 1. Tenta Memória (L1)
    const l1Data = MemoryCache.get<string>(key);
    if (l1Data) return l1Data;

    // 2. Tenta Redis (L2)
    if (this.redis) {
      const l2Data = await this.redis.get(key);
      if (l2Data) {
        // Sincroniza L1 para próxima vez
        MemoryCache.set(key, l2Data);
        return l2Data;
      }
    }

    return null;
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    // 1. Salva na Memória (L1)
    MemoryCache.set(key, value, ttlSeconds * 1000);

    // 2. Salva no Redis (L2) se disponível
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    MemoryCache.delete(key);
    if (this.redis) {
      await this.redis.del(key);
    }
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as unknown as T;
      }
    }

    const freshData = await fetchFn();
    const stringData = JSON.stringify(freshData);
    await this.set(key, stringData, ttlSeconds);
    return freshData;
  }
}

export const cacheService = new CacheService();
