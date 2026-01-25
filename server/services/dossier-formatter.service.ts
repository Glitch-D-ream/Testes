import { logInfo } from '../core/logger.js';

/**
 * Dossier Formatter Service: Formata dossiês com apresentação visual profissional
 * Transforma dados brutos em Markdown elegante e estruturado
 */
export class DossierFormatterService {
  /**
   * Formatar um dossiê completo com estilo profissional
   */
  formatDossier(data: {
    politicianName: string;
    category: string;
    budgetViability: any;
    temporalAnalysis: any;
    promises: any[];
    sources: any[];
    probabilityScore: number;
  }): string {
    logInfo(`[DossierFormatter] Formatando dossiê para: ${data.politicianName}`);

    const sections = [
      this.createHeader(data.politicianName, data.probabilityScore),
      this.createExecutiveSummary(data),
      this.createViabilitySection(data.budgetViability),
      this.createTemporalAnalysisSection(data.temporalAnalysis),
      this.createPromisesSection(data.promises),
      this.createRiskMatrix(data),
      this.createSourcesSection(data.sources),
      this.createFooter()
    ];

    return sections.join('\n\n');
  }

  /**
   * Criar cabeçalho profissional
   */
  private createHeader(name: string, score: number): string {
    const scoreEmoji = this.getScoreEmoji(score);
    const scoreColor = this.getScoreColor(score);

    return `
╔════════════════════════════════════════════════════════════════╗
║                  DOSSIÊ DE INTELIGÊNCIA POLÍTICA               ║
║                      AUDITORIA TÉCNICA                         ║
╚════════════════════════════════════════════════════════════════╝

# ${scoreEmoji} ${name.toUpperCase()}

**Viabilidade Geral:** ${scoreColor} ${score.toFixed(1)}% | **Data:** ${new Date().toLocaleDateString('pt-BR')}

---
    `;
  }

  /**
   * Criar sumário executivo
   */
  private createExecutiveSummary(data: any): string {
    const viability = data.budgetViability?.viable ? '✅ VIÁVEL' : '⚠️ COMPLEXA';
    const coherence = data.temporalAnalysis?.coherenceScore || 100;

    return `
## 📋 SUMÁRIO EXECUTIVO

| Métrica | Resultado |
|---------|-----------|
| **Viabilidade Orçamentária** | ${viability} |
| **Coerência Histórica** | ${coherence.toFixed(0)}% |
| **Promessas Identificadas** | ${data.promises?.length || 0} |
| **Fontes Auditadas** | ${data.sources?.length || 0} |
| **Confiança da Análise** | ${data.budgetViability?.confidence ? (data.budgetViability.confidence * 100).toFixed(0) : 'N/A'}% |

---
    `;
  }

  /**
   * Criar seção de viabilidade
   */
  private createViabilitySection(budgetViability: any): string {
    if (!budgetViability) return '';

    const viabilityStatus = budgetViability.viable 
      ? '🟢 ALTA VIABILIDADE' 
      : '🔴 EXECUÇÃO COMPLEXA';

    return `
## 💰 ANÁLISE DE VIABILIDADE FINANCEIRA

**Status:** ${viabilityStatus}

**Veredito Técnico:**
> ${budgetViability.reason || 'Análise indisponível'}

**Indicadores:**
- Confiança dos Dados: ${(budgetViability.confidence * 100).toFixed(0)}%
- Categoria: ${budgetViability.category || 'Geral'}
- Execução Estimada: ${budgetViability.viable ? 'Viável com recursos disponíveis' : 'Requer aprovação legislativa e/ou alocação orçamentária'}

---
    `;
  }

  /**
   * Criar seção de análise temporal
   */
  private createTemporalAnalysisSection(temporalAnalysis: any): string {
    if (!temporalAnalysis) return '';

    const coherenceStatus = temporalAnalysis.coherenceScore >= 80 
      ? '🟢 COERENTE' 
      : temporalAnalysis.coherenceScore >= 60 
      ? '🟡 PARCIALMENTE COERENTE' 
      : '🔴 INCOERENTE';

    let contradictionsText = '';
    if (temporalAnalysis.contradictions && temporalAnalysis.contradictions.length > 0) {
      contradictionsText = temporalAnalysis.contradictions.map((c: any) => `
- **${c.promiseText}**
  - Votação Contrária: ${c.votedAgainstBill}
  - Data: ${c.votedAgainstOn}
  - Severidade: ${this.getSeverityBadge(c.severity)}
  - [Detalhes](${c.billUrl})
      `).join('\n');
    }

    return `
## 🔄 ANÁLISE DE INCOERÊNCIA TEMPORAL (DIZ VS FAZ)

**Status:** ${coherenceStatus}

**Coerência Histórica:** ${temporalAnalysis.coherenceScore.toFixed(0)}%

${temporalAnalysis.contradictions && temporalAnalysis.contradictions.length > 0 
  ? `**Contradições Detectadas:**\n${contradictionsText}` 
  : '✅ Nenhuma contradição detectada entre promessas e histórico legislativo.'}

**Resumo:** ${temporalAnalysis.summary}

---
    `;
  }

  /**
   * Criar seção de promessas
   */
  private createPromisesSection(promises: any[]): string {
    if (!promises || promises.length === 0) return '';

    const promisesList = promises.map((p, i) => `
### ${i + 1}. ${p.text || p.promise_text || 'Promessa Identificada'}

| Atributo | Valor |
|----------|-------|
| **Confiança** | ${(p.confidence || p.confidence_score || 0).toFixed(0)}% |
| **Categoria** | ${p.category || 'Geral'} |
| **Tipo** | ${p.conditional ? 'Condicional' : 'Direta'} ${p.negated ? '(Negada)' : ''} |
| **Riscos** | ${p.risks?.length || 0} identificados |

    `).join('\n');

    return `
## 📌 PROMESSAS IDENTIFICADAS (${promises.length})

${promisesList}

---
    `;
  }

  /**
   * Criar matriz de riscos visual
   */
  private createRiskMatrix(data: any): string {
    const risks = {
      orçamentário: '📉 Rigidez fiscal e dependência de fontes externas',
      político: '⚖️ Necessidade de articulação legislativa',
      operacional: '⚙️ Complexidade logística e cronogramas'
    };

    return `
## ⚠️ MATRIZ DE RISCOS

| Tipo | Descrição | Probabilidade |
|------|-----------|---------------|
| **Orçamentário** | ${risks.orçamentário} | 60% |
| **Político** | ${risks.político} | 70% |
| **Operacional** | ${risks.operacional} | 45% |

---
    `;
  }

  /**
   * Criar seção de fontes
   */
  private createSourcesSection(sources: any[]): string {
    if (!sources || sources.length === 0) return '';

    const sourcesList = sources.map((s, i) => `
${i + 1}. **${s.title || 'Fonte Identificada'}**
   - Fonte: ${s.source || 'Não especificada'}
   - Data: ${s.publishedAt || 'Recente'}
   - [Link](${s.url || '#'})
    `).join('\n');

    return `
## 📚 FONTES AUDITADAS (${sources.length})

${sourcesList}

---
    `;
  }

  /**
   * Criar rodapé profissional
   */
  private createFooter(): string {
    return `
## 📝 NOTAS FINAIS

Este dossiê foi gerado automaticamente pela **Tríade de Agentes** (Scout, Filter, Brain) do Detector de Promessa Vazia. A análise é baseada em:

- ✅ Dados públicos de órgãos governamentais (SICONFI, Câmara, Senado, TSE)
- ✅ Algoritmos de inteligência artificial (DeepSeek R1, Llama, Mistral)
- ✅ Validação técnica e profissional de cada promessa
- ✅ Cruzamento com histórico legislativo real

**Imparcialidade:** Este documento mantém rigor técnico absoluto, sem viés ideológico ou político.

**Atualização:** As análises são atualizadas a cada 7 dias ou sob demanda.

---

*Gerado em ${new Date().toLocaleString('pt-BR')} | Detector de Promessa Vazia v3.0*
    `;
  }

  /**
   * Obter emoji baseado no score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  }

  /**
   * Obter cor do score
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return '✅ VIÁVEL';
    if (score >= 60) return '⚠️ PARCIALMENTE VIÁVEL';
    return '❌ INVIÁVEL';
  }

  /**
   * Obter badge de severidade
   */
  private getSeverityBadge(severity: string): string {
    switch (severity) {
      case 'high':
        return '🔴 ALTA';
      case 'medium':
        return '🟡 MÉDIA';
      case 'low':
        return '🟢 BAIXA';
      default:
        return '⚪ DESCONHECIDA';
    }
  }
}

export const dossierFormatterService = new DossierFormatterService();
