
import { supabase } from '../core/supabase.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface AdversarialInsight {
  id?: string;
  targetName: string;
  theme: string; // Ex: "Orçamento Secreto", "Votação Contraditória"
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string; // Ex: "Temporal Incoherence", "Vulnerability Auditor"
  evidenceUrl?: string;
  createdAt?: string;
  usageCount?: number;
}

export class AdversarialLearningService {
  /**
   * Registra uma nova descoberta de contradição para aprendizado futuro
   */
  async recordInsight(insight: AdversarialInsight): Promise<void> {
    logInfo(`[AdversarialLearning] Registrando insight: ${insight.targetName} | ${insight.theme}`);
    
    try {
      const { error } = await supabase
        .from('adversarial_insights')
        .insert([{
          target_name: insight.targetName,
          theme: insight.theme,
          severity: insight.severity,
          source: insight.source,
          evidence_url: insight.evidenceUrl,
          created_at: new Date().toISOString(),
          usage_count: 0
        }]);

      if (error) {
        logError(`[AdversarialLearning] Erro ao registrar insight:`, error);
        return;
      }

      logInfo(`[AdversarialLearning] Insight registrado com sucesso`);
    } catch (error) {
      logError(`[AdversarialLearning] Exceção ao registrar insight:`, error as Error);
    }
  }

  /**
   * Recupera insights anteriores para um alvo específico
   */
  async getInsightsForTarget(targetName: string): Promise<AdversarialInsight[]> {
    logInfo(`[AdversarialLearning] Recuperando insights para ${targetName}...`);
    
    try {
      const { data, error } = await supabase
        .from('adversarial_insights')
        .select('*')
        .eq('target_name', targetName)
        .order('severity', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) {
        logError(`[AdversarialLearning] Erro ao recuperar insights:`, error);
        return [];
      }

      logInfo(`[AdversarialLearning] ${data?.length || 0} insights encontrados`);
      return data || [];
    } catch (error) {
      logError(`[AdversarialLearning] Exceção ao recuperar insights:`, error as Error);
      return [];
    }
  }

  /**
   * Gera termos de busca prioritários baseado em insights anteriores
   */
  async generatePrioritySearchTerms(targetName: string): Promise<string[]> {
    const insights = await this.getInsightsForTarget(targetName);
    
    if (insights.length === 0) {
      return [];
    }

    // Criar termos de busca baseado em temas críticos
    const priorityTerms = insights
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .map(i => `${targetName} ${i.theme}`)
      .slice(0, 5);

    logInfo(`[AdversarialLearning] Termos de busca prioritários gerados: ${priorityTerms.length}`);
    return priorityTerms;
  }

  /**
   * Incrementa o contador de uso de um insight (para priorizar insights mais relevantes)
   */
  async incrementUsageCount(insightId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('adversarial_insights')
        .update({ usage_count: supabase.rpc('increment', { id: insightId, column: 'usage_count' }) })
        .eq('id', insightId);

      if (error) {
        logWarn(`[AdversarialLearning] Erro ao incrementar usage_count:`, error);
      }
    } catch (error) {
      logWarn(`[AdversarialLearning] Exceção ao incrementar usage_count:`, error as Error);
    }
  }

  /**
   * Cria a tabela adversarial_insights se não existir
   */
  async initializeTable(): Promise<void> {
    logInfo(`[AdversarialLearning] Inicializando tabela adversarial_insights...`);
    
    try {
      const { error } = await supabase.rpc('create_adversarial_insights_table_if_not_exists');
      if (error) {
        logWarn(`[AdversarialLearning] Tabela pode já existir ou erro ao criar:`, error);
      } else {
        logInfo(`[AdversarialLearning] Tabela inicializada com sucesso`);
      }
    } catch (error) {
      logWarn(`[AdversarialLearning] Exceção ao inicializar tabela:`, error as Error);
    }
  }
}

export const adversarialLearningService = new AdversarialLearningService();
