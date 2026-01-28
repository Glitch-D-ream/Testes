
import { supabase } from '../core/supabase.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export interface AnalysisPersistenceData {
  userId?: string;
  targetName: string;
  profile: any;
  verdict: any;
  specialistReports: any;
  dataLineage: string[];
  consensusScore: number;
  credibilityScore: number;
  processingTimeMs: number;
}

export class AnalysisPersistenceService {
  /**
   * Persiste uma análise completa com todos os relatórios especializados
   */
  async persistAnalysis(data: AnalysisPersistenceData): Promise<string | null> {
    logInfo(`[AnalysisPersistence] Persistindo análise de ${data.targetName}...`);
    
    try {
      const analysisRecord = {
        user_id: data.userId || null,
        politician_name: data.targetName,
        office: data.profile?.office || 'Desconhecido',
        party: data.profile?.party || 'Desconhecido',
        state: data.profile?.state || 'Nacional',
        status: 'completed',
        text: JSON.stringify(data.verdict),
        category: 'AUDITORIA_FORENSE',
        credibility_score: data.credibilityScore,
        consensus_score: data.consensusScore,
        processing_time_ms: data.processingTimeMs,
        data_sources: JSON.stringify({
          dataLineage: data.dataLineage,
          specialistReports: {
            absence: data.specialistReports.absence,
            vulnerability: data.specialistReports.vulnerability,
            finance: data.specialistReports.finance,
            benchmarking: data.specialistReports.benchmarking,
            coherence: data.specialistReports.coherence
          }
        }),
        created_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('analyses')
        .insert([analysisRecord])
        .select('id');

      if (error) {
        logError(`[AnalysisPersistence] Erro ao persistir análise:`, error);
        return null;
      }

      const analysisId = result?.[0]?.id;
      logInfo(`[AnalysisPersistence] ✓ Análise persistida com ID: ${analysisId}`);

      // Persistir relatórios especializados em tabelas separadas
      await Promise.all([
        this.persistAbsenceReport(analysisId, data.specialistReports.absence),
        this.persistVulnerabilityReport(analysisId, data.specialistReports.vulnerability),
        this.persistFinanceReport(analysisId, data.specialistReports.finance),
        this.persistCoherenceReport(analysisId, data.specialistReports.coherence)
      ]);

      return analysisId;
    } catch (error) {
      logError(`[AnalysisPersistence] Exceção ao persistir análise:`, error as Error);
      return null;
    }
  }

  private async persistAbsenceReport(analysisId: string, report: any): Promise<void> {
    if (!report || !report.absences || report.absences.length === 0) return;

    try {
      const records = report.absences.map((absence: any) => ({
        analysis_id: analysisId,
        absence_date: absence.date,
        absence_type: absence.type,
        absence_reason: absence.reason,
        metadata: JSON.stringify(absence)
      }));

      const { error } = await supabase.from('absence_records').insert(records);
      if (error) logWarn(`[AnalysisPersistence] Erro ao persistir absence:`, error);
    } catch (e) {
      logWarn(`[AnalysisPersistence] Exceção ao persistir absence:`, e as Error);
    }
  }

  private async persistVulnerabilityReport(analysisId: string, report: any): Promise<void> {
    if (!report || !report.evidences || report.evidences.length === 0) return;

    try {
      const records = report.evidences.map((evidence: any) => ({
        analysis_id: analysisId,
        vulnerability_type: evidence.type,
        severity: evidence.severity,
        description: evidence.description,
        source_url: evidence.sourceUrl,
        metadata: JSON.stringify(evidence)
      }));

      const { error } = await supabase.from('vulnerability_records').insert(records);
      if (error) logWarn(`[AnalysisPersistence] Erro ao persistir vulnerability:`, error);
    } catch (e) {
      logWarn(`[AnalysisPersistence] Exceção ao persistir vulnerability:`, e as Error);
    }
  }

  private async persistFinanceReport(analysisId: string, report: any[]): Promise<void> {
    if (!report || report.length === 0) return;

    try {
      const records = report.map((finance: any) => ({
        analysis_id: analysisId,
        amendment_type: finance.type,
        amount: finance.value,
        description: finance.description,
        source: finance.source,
        date: finance.date,
        metadata: JSON.stringify(finance)
      }));

      const { error } = await supabase.from('finance_records').insert(records);
      if (error) logWarn(`[AnalysisPersistence] Erro ao persistir finance:`, error);
    } catch (e) {
      logWarn(`[AnalysisPersistence] Exceção ao persistir finance:`, e as Error);
    }
  }

  private async persistCoherenceReport(analysisId: string, report: any): Promise<void> {
    if (!report || !report.contradictions || report.contradictions.length === 0) return;

    try {
      const records = report.contradictions.map((contradiction: any) => ({
        analysis_id: analysisId,
        contradiction_type: contradiction.type,
        description: contradiction.description,
        date_range: contradiction.dateRange,
        severity: contradiction.severity,
        metadata: JSON.stringify(contradiction)
      }));

      const { error } = await supabase.from('coherence_records').insert(records);
      if (error) logWarn(`[AnalysisPersistence] Erro ao persistir coherence:`, error);
    } catch (e) {
      logWarn(`[AnalysisPersistence] Exceção ao persistir coherence:`, e as Error);
    }
  }
}

export const analysisPersistenceService = new AnalysisPersistenceService();
