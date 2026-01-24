import { FilteredSource } from './filter.js';
import { logInfo, logError } from '../core/logger.js';

export class BrainAgent {
  /**
   * O Cérebro Central: Analisa, cruza dados e aprende
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null) {
    logInfo(`[Brain] Iniciando inteligência central para: ${politicianName}`);
    
    // 1. Consolidar conhecimento das fontes
    const consolidatedKnowledge = sources
      .map(s => `[Fonte: ${s.source}] ${s.content}`)
      .join('\n\n');

    try {
      // 2. Análise Profunda via IA (Brain usa o serviço de IA otimizado)
      const { analysisService } = await import('../services/analysis.service.js');
      
      const analysis = await analysisService.createAnalysis(
        userId,
        consolidatedKnowledge,
        politicianName,
        'AGENTS_TRIAD'
      );

      logInfo(`[Brain] Análise concluída com sucesso para ${politicianName}. Score: ${analysis.probabilityScore}`);
      
      return analysis;
    } catch (error) {
      logError(`[Brain] Falha na inteligência central para ${politicianName}`, error as Error);
      throw error;
    }
  }
}

export const brainAgent = new BrainAgent();
