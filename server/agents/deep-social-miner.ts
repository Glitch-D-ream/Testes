
import { logInfo, logError } from '../core/logger.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { ingestionService } from '../services/ingestion.service.ts';

export interface SocialEvidence {
  platform: 'twitter' | 'instagram' | 'facebook' | 'blog' | 'youtube' | 'interview';
  content: string;
  url: string;
  date?: string;
  relevance: number;
}

export class DeepSocialMiner {
  /**
   * Mineração profunda em redes sociais, blogs e entrevistas
   */
  async mine(targetName: string): Promise<SocialEvidence[]> {
    logInfo(`[DeepSocialMiner] Iniciando mineração social para: ${targetName}`);
    
    const queries = [
      `${targetName} site:twitter.com`,
      `${targetName} site:instagram.com`,
      `${targetName} "entrevista" OR "entrevistado"`,
      `${targetName} blog OR "artigo de opinião"`,
      `${targetName} "polêmica" site:youtube.com`
    ];

    const evidences: SocialEvidence[] = [];

    try {
      const searchResults = await Promise.all(
        queries.map(q => directSearchImproved.search(q).catch(() => []))
      );

      const flatResults = searchResults.flat().slice(0, 15);
      
      logInfo(`[DeepSocialMiner] Encontradas ${flatResults.length} potenciais fontes sociais/blogs.`);

      for (const res of flatResults) {
        const platform = this.detectPlatform(res.url);
        
        // Ingestão rápida apenas de texto para evitar timeouts
        const ingested = await ingestionService.ingest(res.url).catch(() => null);
        
        if (ingested && ingested.content.length > 100) {
          evidences.push({
            platform,
            content: ingested.content,
            url: res.url,
            relevance: this.calculateRelevance(ingested.content, targetName)
          });
        }
      }

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
    if (content.toLowerCase().includes(target.toLowerCase())) score += 50;
    keywords.forEach(k => {
      if (content.toLowerCase().includes(k)) score += 10;
    });
    return Math.min(score, 100);
  }
}

export const deepSocialMiner = new DeepSocialMiner();
