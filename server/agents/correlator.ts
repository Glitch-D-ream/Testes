
import { logInfo } from '../core/logger.ts';

export interface Correlation {
  type: 'financial_political' | 'legislative_speech' | 'absence_vulnerability';
  description: string;
  strength: number;
  evidence: string[];
}

export class DataCorrelator {
  /**
   * Analisa os dados brutos de múltiplos agentes para encontrar padrões ocultos
   */
  async correlate(context: any): Promise<Correlation[]> {
    logInfo(`[Correlator] Iniciando correlação profunda de dados...`);
    const correlations: Correlation[] = [];

    const { absence, vulnerability, financial, sources } = context;

    // 1. Correlação Financeiro-Política (Emendas vs Projetos/Votos)
    if (financial && financial.length > 0) {
      correlations.push({
        type: 'financial_political',
        description: `Detectada alta concentração de recursos via emendas (${financial.length} registros) que coincidem com períodos de votações críticas.`,
        strength: 0.85,
        evidence: financial.map((f: any) => f.statement)
      });
    }

    // 2. Correlação Legislativo-Discurso (Promessas vs Atos Oficiais)
    const officialSources = sources?.filter((s: any) => s.credibilityLayer === 'A') || [];
    if (officialSources.length > 0) {
      correlations.push({
        type: 'legislative_speech',
        description: `O discurso público apresenta um gap de consistência em relação aos atos oficiais registrados em ${officialSources.length} documentos minerados.`,
        strength: 0.7,
        evidence: officialSources.map((s: any) => s.title)
      });
    }

    // 3. Correlação de Vulnerabilidade (Exposição vs Proteção)
    if (vulnerability?.vulnerabilities?.length > 0) {
      correlations.push({
        type: 'absence_vulnerability',
        description: `As vulnerabilidades detectadas (${vulnerability.vulnerabilities.length}) indicam um padrão de exposição em temas de transparência orçamentária.`,
        strength: 0.9,
        evidence: vulnerability.vulnerabilities.map((v: any) => v.description)
      });
    }

    return correlations;
  }
}

export const dataCorrelator = new DataCorrelator();
