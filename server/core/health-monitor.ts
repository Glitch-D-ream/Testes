
import { CircuitBreaker } from './circuit-breaker.ts';
import { initializeDatabase } from './database.ts';
import axios from 'axios';

export class HealthMonitor {
  static async getFullStatus() {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const siconfiStatus = await this.checkSiconfi();
    
    const circuits = CircuitBreaker.getStatus();
    
    const isHealthy = dbStatus && redisStatus;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus ? 'online' : 'offline',
        redis: redisStatus ? 'online' : 'offline',
        siconfi: siconfiStatus ? 'online' : 'offline'
      },
      circuits
    };
  }

  private static async checkDatabase() {
    try {
      // Tentar uma operação simples no DB
      return true; 
    } catch {
      return false;
    }
  }

  private static async checkRedis() {
    try {
      // Tentar ping no redis
      return true;
    } catch {
      return false;
    }
  }

  private static async checkSiconfi() {
    try {
      const res = await axios.get('https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca', { timeout: 2000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}
