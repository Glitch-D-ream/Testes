import Redis from 'ioredis';
import { logInfo, logError } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class CacheService {
  private client: Redis | null = null;

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      this.client.on('error', (err) => {
        logError('Erro na conexão com Redis', err);
      });

      this.client.on('connect', () => {
        logInfo('Conectado ao Redis com sucesso');
      });
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 3600): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const freshData = await fetchFn();
    await this.set(key, JSON.stringify(freshData), ttlSeconds);
    return freshData;
  }
}

export const cacheService = new CacheService();
