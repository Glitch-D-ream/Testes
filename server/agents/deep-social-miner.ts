
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { ingestionService } from '../services/ingestion.service.ts';

export interface SocialEvidence {
  platform: 'twitter' | 'instagram' | 'facebook' | 'blog' | 'youtube' | 'interview';
  content: string;
  url: string;
  date?: string;
  relevance: number;
}

/**
 * DeepSocialMiner v3.2 - HIGH SPEED EDITION
 */
export class DeepSocialMiner {
  private readonly MAX_SOURCES = 8; // Reduzido para focar em qualidade
  private readonly CONCURRENT_INGESTS = 4;

  async mine(targetName: string): Promise<SocialEvidence[]> {
    logInfo(`[DeepSocialMiner] 📱 Mineração social otimizada para: ${targetName}`);
    
    const queries = [
      `${targetName} site:twitter.com`,
      `${targetName} site:instagram.com`,
      `${targetName} "entrevista" OR "declaração"`,
      `${targetName} "polêmica" site:youtube.com`
    ];

    try {
      // 1. Busca rápida em paralelo
      const searchResults = await Promise.all(
        queries.map(q => directSearchImproved.search(q).catch(() => []))
      );

      const flatResults = searchResults.flat().slice(0, 15);
      logInfo(`[DeepSocialMiner] ${flatResults.length} fontes candidatas encontradas.`);

      const evidences: SocialEvidence[] = [];
      
      // 2. Ingestão paralela controlada
      const targetResults = flatResults.slice(0, this.MAX_SOURCES);
      const processBatch = async (results: any[]) => {
        return Promise.all(results.map(async (res) => {
          try {
            const platform = this.detectPlatform(res.url);
            // Ingestão ultra-rápida (timeout de 10s para social)
            const ingested = await Promise.race([
              ingestionService.ingest(res.url),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]).catch(() => null);
            
            if (ingested && ingested.content.length > 100) {
              return {
                platform,
                content: ingested.content.substring(0, 2000),
                url: res.url,
                relevance: this.calculateRelevance(ingested.content, targetName)
              };
            }
          } catch (e) {}
          return null;
        }));
      };

      const results = await processBatch(targetResults);
      results.forEach(r => { if (r) evidences.push(r as SocialEvidence); });

      return evidences.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      logError(`[DeepSocialMiner] Erro na mineração social:`, error as Error);
      return [];
    }
  }

  private detectPlatform(url: string): any {
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com')) return 'youtube';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('blog') || url.includes('medium.com')) return 'blog';
    return 'interview';
  }

  private calculateRelevance(content: string, target: string): number {
    const keywords = ['corrupção', 'promessa', 'voto', 'escândalo', 'emenda', 'opinião'];
    let score = 0;
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes(target.toLowerCase())) score += 50;
    keywords.forEach(k => { if (lowerContent.includes(k)) score += 10; });
    return Math.min(score, 100);
  }
}

export const deepSocialMiner = new DeepSocialMiner();
