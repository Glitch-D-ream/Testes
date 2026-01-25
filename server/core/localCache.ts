import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

export class LocalCache {
  private cacheDir: string;
  private ttlMs: number;

  constructor(cacheDir: string = '/tmp/scout_cache', ttlHours: number = 24) {
    this.cacheDir = cacheDir;
    this.ttlMs = ttlHours * 3600000;
    
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const hash = createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  public async get(key: string): Promise<any | null> {
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) return null;

    try {
      const stats = fs.statSync(filePath);
      const age = Date.now() - stats.mtimeMs;

      if (age > this.ttlMs) {
        fs.unlinkSync(filePath);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ [LocalCache] Erro ao ler cache local:', error);
      return null;
    }
  }

  public async set(key: string, value: any): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      fs.writeFileSync(filePath, JSON.stringify(value), 'utf8');
    } catch (error) {
      console.error('❌ [LocalCache] Erro ao salvar cache local:', error);
    }
  }

  public async clear(): Promise<void> {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    } catch (error) {
      console.error('❌ [LocalCache] Erro ao limpar cache local:', error);
    }
  }
}

export const localCache = new LocalCache();
