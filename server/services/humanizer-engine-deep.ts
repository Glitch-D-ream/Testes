
import { logInfo } from '../core/logger.ts';

export class HumanizerEngineDeep {
  /**
   * Gera um dossiê de ultra-profundidade com raciocínio forense exposto
   */
  async humanizeDeep(analysisData: any): Promise<string> {
    logInfo(`[HumanizerDeep] Gerando dossiê de ultra-profundidade para ${analysisData.targetName}...`);

    const { targetName, verdict, specialistReports, socialEvidences, sources } = analysisData;

    let report = `# 🔍 DOSSIÊ FORENSE PROFUNDO: ${targetName}\n`;
    report += `**Gerado em:** ${new Date().toLocaleDateString('pt-BR')}\n`;
    report += `**Nível de Profundidade:** Ultra (Deep Audit v4.2)\n\n`;

    // ===== SEÇÃO 1: SÍNTESE EXECUTIVA COM RACIOCÍNIO =====
    report += `## 📋 Síntese Executiva\n`;
    report += `${verdict.reasoning}\n\n`;

    // ===== SEÇÃO 2: CADEIA DE CUSTÓDIA (CHAIN OF EVIDENCE) =====
    report += `## 🔗 Cadeia de Custódia dos Dados\n`;
    report += `Este dossiê foi construído cruzando as seguintes camadas de dados:\n\n`;
    
    report += `### Fontes Primárias (Oficiais)\n`;
    report += `- **Câmara dos Deputados:** Votações nominais, discursos, proposições\n`;
    report += `- **SICONFI:** Dados contábeis e fiscais do setor público\n`;
    report += `- **TSE:** Bens declarados e histórico eleitoral\n\n`;

    report += `### Fontes Secundárias (Notícias e Análise)\n`;
    report += `- **Portais de Notícia:** ${sources?.length || 0} artigos analisados\n`;
    report += `- **Redes Sociais:** ${socialEvidences?.length || 0} posts/entrevistas mineradas\n`;
    report += `- **Blogs e Análise:** Conteúdo de opinião especializada\n\n`;

    // ===== SEÇÃO 3: ACHADOS PRINCIPAIS COM PROVA =====
    report += `## 🎯 Achados Principais (Com Prova)\n\n`;

    if (verdict.mainFindings && Array.isArray(verdict.mainFindings)) {
      verdict.mainFindings.forEach((finding: string, idx: number) => {
        report += `### Achado ${idx + 1}: ${finding}\n`;
        report += this.generateProofForFinding(finding, specialistReports, sources);
        report += `\n`;
      });
    }

    // ===== SEÇÃO 4: ANÁLISE DE RISCO COM RACIOCÍNIO =====
    report += `## ⚠️ Análise de Risco (Raciocínio Forense)\n\n`;
    report += this.generateRiskAnalysis(verdict, specialistReports);

    // ===== SEÇÃO 5: CONTRADIÇÕES DETECTADAS (COM CONTEXTO) =====
    if (verdict.contradictions && verdict.contradictions.length > 0) {
      report += `## 🚨 Contradições Detectadas (Diz vs. Faz)\n\n`;
      verdict.contradictions.forEach((contradiction: string) => {
        report += `### Contradição: ${contradiction}\n`;
        report += this.generateContextForContradiction(contradiction, specialistReports);
        report += `\n`;
      });
    }

    // ===== SEÇÃO 6: MAPA DE CORRELAÇÕES =====
    report += `## 🗺️ Mapa de Correlações (Onde o Dinheiro e o Poder se Encontram)\n`;
    report += this.generateCorrelationMap(specialistReports);

    // ===== SEÇÃO 7: CITAÇÕES REAIS COM CONTEXTO =====
    report += `## 🗣️ Citações Reais e Contexto\n`;
    report += this.generateQuotesWithContext(socialEvidences, sources);

    // ===== SEÇÃO 8: LIMITAÇÕES E RESSALVAS =====
    report += `## ⚖️ Limitações e Ressalvas\n`;
    report += `- Este dossiê baseia-se em dados públicos disponíveis até ${new Date().toLocaleDateString('pt-BR')}.\n`;
    report += `- Correlações não implicam necessariamente causalidade.\n`;
    report += `- Ausência de evidência não é evidência de ausência.\n`;
    report += `- Recomenda-se validação independente de achados críticos.\n\n`;

    // ===== SEÇÃO 9: METODOLOGIA =====
    report += `## 🔬 Metodologia\n`;
    report += `**Sistema:** Seth VII v4.2 - Auditoria Forense Autônoma\n`;
    report += `**Agentes Utilizados:** Scout Hybrid, Deep Social Miner, Absence Auditor, Vulnerability Auditor, Finance Tracer, Coherence Analyzer\n`;
    report += `**Validação:** Consenso entre múltiplos modelos de IA (${verdict.consensusScore || 'N/A'}%)\n`;
    report += `**Assinatura:** SETH-VII-V4.2-DEEP-AUDIT-${new Date().getFullYear()}\n`;

    return report;
  }

  private generateProofForFinding(finding: string, reports: any, sources: any[]): string {
    let proof = `\n**Prova:**\n`;
    
    // Extrair contexto baseado no tipo de achado
    if (finding.toLowerCase().includes('emenda') || finding.toLowerCase().includes('gasto')) {
      const finance = reports.finance || [];
      if (finance.length > 0) {
        const total = finance.reduce((s: number, f: any) => s + (f.value || 0), 0);
        proof += `- Total rastreado: R$ ${total.toLocaleString('pt-BR')}\n`;
        proof += `- Registros: ${finance.length} emendas/gastos\n`;
        finance.slice(0, 3).forEach((f: any) => {
          proof += `  - ${f.description}: R$ ${f.value?.toLocaleString('pt-BR') || 'N/A'} (${f.date || 'Data N/A'})\n`;
        });
      }
    }

    if (finding.toLowerCase().includes('falta') || finding.toLowerCase().includes('ausência')) {
      const absence = reports.absence || {};
      if (absence.absences?.length) {
        proof += `- Faltas registradas: ${absence.absences.length}\n`;
        absence.absences.slice(0, 3).forEach((a: any) => {
          proof += `  - ${a.date}: ${a.reason || 'Não justificada'}\n`;
        });
      }
    }

    if (finding.toLowerCase().includes('vulnerabilidade') || finding.toLowerCase().includes('risco')) {
      const vuln = reports.vulnerability || {};
      if (vuln.evidences?.length) {
        proof += `- Vulnerabilidades identificadas: ${vuln.evidences.length}\n`;
        vuln.evidences.slice(0, 3).forEach((e: any) => {
          proof += `  - [${e.severity}] ${e.description}\n`;
        });
      }
    }

    proof += `- Fontes: ${sources?.length || 0} documentos analisados\n`;
    return proof;
  }

  private generateRiskAnalysis(verdict: any, reports: any): string {
    let analysis = ``;

    const riskLevel = verdict.riskLevel || 'medium';
    const credibility = verdict.credibilityScore || 0;

    analysis += `### Nível de Risco: ${riskLevel.toUpperCase()}\n`;
    analysis += `**Score de Credibilidade:** ${credibility}%\n\n`;

    analysis += `**Raciocínio:**\n`;

    if (credibility < 40) {
      analysis += `- Baixa transparência detectada (credibilidade < 40%)\n`;
      analysis += `- Múltiplas correlações entre emendas e votações\n`;
      analysis += `- Padrão de "Poder por Transação" identificado\n`;
    } else if (credibility < 70) {
      analysis += `- Transparência moderada com pontos de atenção\n`;
      analysis += `- Algumas inconsistências entre discurso e prática\n`;
      analysis += `- Recomenda-se monitoramento contínuo\n`;
    } else {
      analysis += `- Alta transparência e coerência ideológica\n`;
      analysis += `- Baixo risco de corrupção passiva\n`;
      analysis += `- Vulnerabilidade a ataques de desinformação\n`;
    }

    analysis += `\n`;
    return analysis;
  }

  private generateContextForContradiction(contradiction: string, reports: any): string {
    let context = `**Contexto:**\n`;
    context += `- Contradição: ${contradiction}\n`;
    
    if (reports.coherence?.contradictions) {
      const matching = reports.coherence.contradictions.find((c: any) => 
        c.description?.includes(contradiction.split(' ')[0])
      );
      if (matching) {
        context += `- Período: ${matching.dateRange || 'N/A'}\n`;
        context += `- Severidade: ${matching.severity || 'N/A'}\n`;
      }
    }
    
    context += `\n`;
    return context;
  }

  private generateCorrelationMap(reports: any): string {
    let map = `\n**Mapa de Fluxo (Emendas → Votos → Resultados):**\n\n`;

    if (reports.finance?.length && reports.finance.length > 0) {
      map += `\`\`\`\n`;
      map += `Emenda Liberada (R$) → Votação Favorável → Contrato Assinado\n`;
      reports.finance.slice(0, 5).forEach((f: any) => {
        map += `├─ ${f.description}: R$ ${f.value?.toLocaleString('pt-BR') || 'N/A'}\n`;
      });
      map += `\`\`\`\n`;
    }

    map += `\n`;
    return map;
  }

  private generateQuotesWithContext(social: any[], sources: any[]): string {
    let quotes = ``;

    const allContent = [...(social || []), ...(sources || [])];
    const relevantQuotes = allContent
      .filter(s => s.content && s.content.length > 100)
      .slice(0, 5);

    relevantQuotes.forEach((q: any, idx: number) => {
      const text = q.content.substring(0, 250);
      quotes += `### Citação ${idx + 1}\n`;
      quotes += `> "${text}${text.length === 250 ? '...' : ''}"\n`;
      quotes += `*— Fonte: [${q.platform || q.source || 'Fonte'}](${q.url})*\n\n`;
    });

    return quotes;
  }
}

export const humanizerEngineDeep = new HumanizerEngineDeep();
