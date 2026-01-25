/**
 * Serviço de Análise de Coerência
 * Integra a análise de incoerências legislativas no fluxo de análise de promessas
 */

import { nanoid } from 'nanoid';
import { getSupabase } from '../core/database.ts';
import { analyzeCoherence, generateCoherenceSummary, IncoherenceReport } from '../modules/coherence-analyzer.ts';
import { ExtractedPromise } from '../modules/nlp.ts';
import { logInfo, logError } from '../core/logger.ts';

export class CoherenceService {
  /**
   * Analisa a coerência de todas as promessas extraídas
   */
  async analyzePromisesCoherence(
    analysisId: string,
    promises: ExtractedPromise[],
    politicianName: string
  ): Promise<IncoherenceReport[]> {
    const reports: IncoherenceReport[] = [];

    try {
      logInfo(`[CoherenceService] Iniciando análise de coerência para ${promises.length} promessas`);

      for (const promise of promises) {
        const promiseId = nanoid();
        
        try {
          const report = await analyzeCoherence(promise, politicianName, promiseId);
          reports.push(report);

          // Salvar relatório de coerência no Supabase
          await this.saveCoherenceReport(analysisId, promiseId, report);
        } catch (error) {
          logError(`[CoherenceService] Erro ao analisar coerência da promessa: ${promise.text}`, error as Error);
          // Continuar com a próxima promessa
        }
      }

      logInfo(`[CoherenceService] Análise de coerência concluída. ${reports.length} relatórios gerados.`);
    } catch (error) {
      logError('[CoherenceService] Erro geral na análise de coerência', error as Error);
    }

    return reports;
  }

  /**
   * Salva o relatório de coerência no banco de dados
   */
  private async saveCoherenceReport(
    analysisId: string,
    promiseId: string,
    report: IncoherenceReport
  ): Promise<void> {
    try {
      const supabase = getSupabase();

      // Preparar dados para inserção
      const coherenceData = {
        id: nanoid(),
        analysis_id: analysisId,
        promise_id: promiseId,
        coherence_score: report.coherenceScore,
        incoherences_count: report.incoherences.length,
        incoherences_data: report.incoherences,
        summary: generateCoherenceSummary(report),
        created_at: new Date().toISOString()
      };

      // Inserir no Supabase
      const { error } = await supabase
        .from('promise_coherence')
        .insert([coherenceData]);

      if (error) {
        logError('[CoherenceService] Erro ao salvar relatório de coerência', error as any);
      }
    } catch (error) {
      logError('[CoherenceService] Erro ao salvar relatório de coerência', error as Error);
    }
  }

  /**
   * Recupera o relatório de coerência de uma promessa
   */
  async getCoherenceReport(promiseId: string) {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('promise_coherence')
        .select('*')
        .eq('promise_id', promiseId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logError('[CoherenceService] Erro ao recuperar relatório de coerência', error as any);
      }

      return data;
    } catch (error) {
      logError('[CoherenceService] Erro ao recuperar relatório de coerência', error as Error);
      return null;
    }
  }

  /**
   * Recupera todos os relatórios de coerência de uma análise
   */
  async getAnalysisCoherenceReports(analysisId: string) {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('promise_coherence')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false });

      if (error) {
        logError('[CoherenceService] Erro ao recuperar relatórios de coerência', error as any);
        return [];
      }

      return data || [];
    } catch (error) {
      logError('[CoherenceService] Erro ao recuperar relatórios de coerência', error as Error);
      return [];
    }
  }

  /**
   * Calcula o score de coerência médio de uma análise
   */
  async getAnalysisAverageCoherence(analysisId: string): Promise<number> {
    try {
      const reports = await this.getAnalysisCoherenceReports(analysisId);

      if (reports.length === 0) {
        return 100; // Se não há incoerências, considerar 100% coerente
      }

      const totalScore = reports.reduce((sum, report) => sum + (report.coherence_score || 0), 0);
      return Math.round(totalScore / reports.length);
    } catch (error) {
      logError('[CoherenceService] Erro ao calcular coerência média', error as Error);
      return 100;
    }
  }
}

export const coherenceService = new CoherenceService();
