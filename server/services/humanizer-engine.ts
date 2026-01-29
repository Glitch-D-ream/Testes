
import { logInfo } from '../core/logger.ts';

export class HumanizerEngine {
  /**
   * Transforma dados técnicos em um relatório humanizado e acessível
   * RESTAURADO: Prioriza a incisividade do Verdict Engine original
   */
  async humanize(analysisData: any): Promise<string> {
    logInfo(`[HumanizerEngine] Humanizando relatório para ${analysisData.targetName}...`);

    const { targetName, verdict, specialistReports, socialEvidences, sources } = analysisData;

    // Se o veredito já contém um reasoning longo (do Double-Pass ou Consensus), usamos ele como base
    // Isso evita que o template fixo "suavize" a análise profunda da IA
    const baseAnalysis = verdict.reasoning || "";
    
    // Extrair citações reais das evidências sociais e notícias
    const quotes = this.extractQuotes(socialEvidences, sources);

    let report = `# 🇧🇷 Dossiê de Inteligência Forense: ${targetName}\n\n`;
    
    // Se a IA já gerou um relatório estruturado, usamos ele. 
    // Caso contrário, montamos a estrutura clássica.
    if (baseAnalysis.length > 500 && baseAnalysis.includes('#')) {
      report += baseAnalysis;
    } else {
      report += `## 📝 Resumo Direto\n`;
      report += `${verdict.reasoning || "Análise baseada em dados oficiais e discursos minerados."}\n\n`;

      report += `## ⚖️ O que você precisa saber\n`;
      if (verdict.mainFindings && verdict.mainFindings.length > 0) {
        verdict.mainFindings.forEach((f: string) => {
          report += `- **${f}**\n`;
        });
      } else if (specialistReports.coherence?.redFlags) {
        specialistReports.coherence.redFlags.slice(0, 5).forEach((f: string) => {
          report += `- **${f}**\n`;
        });
      }
      report += `\n`;

      if (verdict.contradictions && verdict.contradictions.length > 0) {
        report += `## ⚠️ "Diz vs. Faz" (Contradições)\n`;
        verdict.contradictions.forEach((c: string) => {
          report += `- ${c}\n`;
        });
        report += `\n`;
      }
    }

    // Seção de Citações (Sempre útil)
    if (quotes.length > 0) {
      report += `\n## 🗣️ Citações e Declarações Reais\n`;
      quotes.slice(0, 3).forEach(q => {
        report += `> "${q.text}"\n`;
        report += `*— Fonte: [${q.source}](${q.url})*\n\n`;
      });
    }

    // Raio-X Técnico com Lógica de Fallback Corrigida
    report += `\n## 📊 Raio-X Técnico (Auditado)\n`;
    
    // Soma financeira inteligente: Cota + Emendas + Evidências
    let totalFinanceiro = 0;
    if (specialistReports.finance && specialistReports.finance.length > 0) {
      totalFinanceiro += specialistReports.finance.reduce((s: number, f: any) => s + (f.value || 0), 0);
    }
    if (specialistReports.coherence?.expenseAnalysis?.profile?.totalExpenses) {
      totalFinanceiro += specialistReports.coherence.expenseAnalysis.profile.totalExpenses;
    }

    if (totalFinanceiro > 0) {
      report += `- **Rastreio Financeiro:** Identificados **R$ ${totalFinanceiro.toLocaleString('pt-BR')}** em recursos públicos associados.\n`;
    } else {
      report += `- **Rastreio Financeiro:** Nenhum gasto direto em cota parlamentar identificado (Alvo pode não ser parlamentar ativo).\n`;
    }
    
    if (specialistReports.absence?.absences?.length) {
      report += `- **Presença Legislativa:** O político registrou **${specialistReports.absence.absences.length}** ausências em sessões oficiais.\n`;
    }

    if (analysisData.tseHistory) {
      report += `- **Histórico Eleitoral:** ${analysisData.tseHistory.totalElections} eleições disputadas, ${analysisData.tseHistory.totalElected} vitórias.\n`;
    }

    report += `\n---\n*Este relatório foi gerado pelo Seth VII v6.0 (Ironclad Engine), cruzando dados oficiais, redes sociais e auditoria forense para garantir transparência total.*`;

    return report;
  }

  private extractQuotes(social: any[], sources: any[]): any[] {
    const all = [...(social || []), ...(sources || [])];
    const quotes: any[] = [];

    all.forEach(s => {
      const text = s.content || s.snippet || "";
      const match = text.match(/"([^"]{40,200})"/);
      if (match) {
        quotes.push({ text: match[1], source: s.platform || s.source || 'Fonte', url: s.url });
      } else if (text.length > 100) {
        quotes.push({ text: text.substring(0, 150) + "...", source: s.platform || s.source || 'Fonte', url: s.url });
      }
    });

    return quotes.filter((v, i, a) => a.findIndex(t => t.text === v.text) === i);
  }
}

export const humanizerEngine = new HumanizerEngine();
