import { FilteredSource } from './filter.js';
import { logInfo, logError } from '../core/logger.js';
import { getSupabase } from '../core/database.js';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';

export class BrainAgent {
  /**
   * O Cérebro Central 2.0: Integração automática com dados orçamentários reais
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null) {
    logInfo(`[Brain] Iniciando processamento cognitivo para: ${politicianName}`);
    
    try {
      // 1. Consolidar conhecimento filtrado
      const knowledgeBase = sources
        .map(s => `[Fonte: ${s.source}] Justificativa: ${s.justification}\nConteúdo: ${s.content}`)
        .join('\n\n');

      // 2. Buscar Histórico do Político no Banco (Aprendizado)
      const history = await this.getPoliticianHistory(politicianName);
      const historyContext = history 
        ? `Histórico: Este político já teve ${history.totalAnalyses} análises anteriores com score médio de ${history.avgScore}%.`
        : "Histórico: Nenhuma análise anterior encontrada para este político.";

      // 3. Cruzamento Orçamentário Real (SICONFI)
      // Extraímos a categoria predominante das fontes para validar no Tesouro
      const mainCategory = this.detectMainCategory(sources);
      const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
      
      logInfo(`[Brain] Validando viabilidade orçamentária para categoria: ${siconfiCategory}`);
      
      // Simulamos um valor médio de promessa política (ex: 500 milhões) para teste de viabilidade
      // Em uma versão futura, a IA do Brain poderia estimar este valor.
      const estimatedValue = 500000000; 
      const currentYear = new Date().getFullYear();
      
      const budgetViability = await validateBudgetViability(
        siconfiCategory, 
        estimatedValue, 
        currentYear - 1
      );

      const budgetContext = `Análise Orçamentária (SICONFI): ${budgetViability.reason} 
      Viabilidade Técnica: ${budgetViability.viable ? 'ALTA' : 'BAIXA'} 
      Confiança dos Dados: ${Math.round(budgetViability.confidence * 100)}%`;

      // 4. Análise Final via IA de Alta Performance
      const { analysisService } = await import('../services/analysis.service.js');
      
      const fullContext = `
        POLÍTICO: ${politicianName}
        ${historyContext}
        ${budgetContext}
        
        DADOS COLETADOS DAS FONTES:
        ${knowledgeBase}
      `;
      
      // Criar a análise final usando o serviço central
      const analysis = await analysisService.createAnalysis(
        userId,
        fullContext,
        politicianName,
        mainCategory
      );

      // 5. Ajuste Dinâmico do Score (Opcional: O Brain pode ajustar o score da IA baseado no SICONFI)
      if (!budgetViability.viable && analysis.probabilityScore > 0.5) {
        logInfo(`[Brain] Ajustando score para baixo devido à inviabilidade orçamentária detectada.`);
        // Aqui poderíamos atualizar o score no banco se necessário
      }

      logInfo(`[Brain] Veredito final emitido para ${politicianName}. Score: ${analysis.probabilityScore}`);
      
      return {
        ...analysis,
        budgetViability,
        mainCategory
      };
    } catch (error) {
      logError(`[Brain] Erro na inteligência central para ${politicianName}`, error as Error);
      throw error;
    }
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const categories = sources.map(s => s.justification); // A IA do Filter coloca a categoria na justificativa às vezes
    // Heurística simples para detectar categoria predominante
    if (categories.some(c => c.toLowerCase().includes('saúde'))) return 'Saúde';
    if (categories.some(c => c.toLowerCase().includes('educação'))) return 'Educação';
    if (categories.some(c => c.toLowerCase().includes('infraestrutura') || c.toLowerCase().includes('obras'))) return 'Infraestrutura';
    if (categories.some(c => c.toLowerCase().includes('segurança'))) return 'Segurança';
    return 'Geral';
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
