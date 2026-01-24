import { FilteredSource } from './filter.js';
import { logInfo, logError } from '../core/logger.js';
import { getSupabase } from '../core/database.js';

export class BrainAgent {
  /**
   * O Cérebro Central: A inteligência que cruza dados e gera o veredito final
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null) {
    logInfo(`[Brain] Iniciando processamento cognitivo para: ${politicianName}`);
    
    // 1. Consolidar conhecimento filtrado
    const knowledgeBase = sources
      .map(s => `[Fonte: ${s.source}] Justificativa: ${s.justification}\nConteúdo: ${s.content}`)
      .join('\n\n');

    try {
      // 2. Buscar Histórico do Político no Banco (Aprendizado)
      const history = await this.getPoliticianHistory(politicianName);
      const historyContext = history 
        ? `Histórico: Este político já teve ${history.totalAnalyses} análises anteriores com score médio de ${history.avgScore}%.`
        : "Histórico: Nenhuma análise anterior encontrada para este político.";

      // 3. Cruzamento Orçamentário (Simulado com dados do SICONFI/Cache)
      const budgetContext = "Orçamento: Verificando limites fiscais e disponibilidade orçamentária para as categorias mencionadas...";

      // 4. Análise Final via IA de Alta Performance (Gemini/Brain)
      const { analysisService } = await import('../services/analysis.service.js');
      
      const fullContext = `${historyContext}\n${budgetContext}\n\nDados Coletados:\n${knowledgeBase}`;
      
      const analysis = await analysisService.createAnalysis(
        userId,
        fullContext,
        politicianName,
        'AGENTS_TRIAD_V2'
      );

      logInfo(`[Brain] Veredito final emitido para ${politicianName}. Score: ${analysis.probabilityScore}`);
      
      return analysis;
    } catch (error) {
      logError(`[Brain] Erro na inteligência central para ${politicianName}`, error as Error);
      throw error;
    }
  }

  private async getPoliticianHistory(name: string) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('analyses')
        .select('probability_score')
        .ilike('author', `%${name}%`);

      if (error || !data || data.length === 0) return null;

      const totalAnalyses = data.length;
      const avgScore = data.reduce((acc, curr) => acc + (curr.probability_score || 0), 0) / totalAnalyses;

      return { totalAnalyses, avgScore: Math.round(avgScore * 100) };
    } catch {
      return null;
    }
  }
}

export const brainAgent = new BrainAgent();
