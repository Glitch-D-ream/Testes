
import { logInfo } from '../core/logger.ts';

export class HumanizerEngine {
  /**
   * Transforma dados técnicos em um relatório humanizado e acessível
   */
  async humanize(analysisData: any): Promise<string> {
    logInfo(`[HumanizerEngine] Humanizando relatório para ${analysisData.targetName}...`);

    const { targetName, verdict, specialistReports, socialEvidences } = analysisData;

    // Extrair citações reais das evidências sociais e notícias
    const quotes = this.extractQuotes(socialEvidences, analysisData.sources);

    let report = `# 🇧🇷 Dossiê Cidadão: ${targetName}\n\n`;
    
    report += `## 📝 Resumo Direto\n`;
    report += `${verdict.reasoning}\n\n`;

    report += `## ⚖️ O que você precisa saber\n`;
    verdict.mainFindings.forEach((f: string) => {
      report += `- **${f}**\n`;
    });
    report += `\n`;

    if (verdict.contradictions && verdict.contradictions.length > 0) {
      report += `## ⚠️ "Diz vs. Faz" (Contradições)\n`;
      verdict.contradictions.forEach((c: string) => {
        report += `- ${c}\n`;
      });
      report += `\n`;
    }

    if (quotes.length > 0) {
      report += `## 🗣️ Citações e Declarações Reais\n`;
      quotes.slice(0, 3).forEach(q => {
        report += `> "${q.text}"\n`;
        report += `*— Fonte: [${q.source}](${q.url})*\n\n`;
      });
    }

    report += `## 📊 Raio-X Técnico (Simplificado)\n`;
    if (specialistReports.finance?.length) {
      const total = specialistReports.finance.reduce((s: number, f: any) => s + (f.value || 0), 0);
      report += `- **Dinheiro Público:** Foram rastreados cerca de **R$ ${total.toLocaleString('pt-BR')}** em emendas e gastos associados.\n`;
    }
    
    if (specialistReports.absence?.absences?.length) {
      report += `- **Presença:** O político faltou a **${specialistReports.absence.absences.length}** sessões importantes.\n`;
    }

    report += `\n---\n*Este relatório foi gerado pelo Seth VII v4.1, cruzando dados oficiais, redes sociais e notícias para garantir a sua transparência.*`;

    return report;
  }

  private extractQuotes(social: any[], sources: any[]): any[] {
    const all = [...(social || []), ...(sources || [])];
    const quotes: any[] = [];

    all.forEach(s => {
      const text = s.content || s.snippet || "";
      // Busca por padrões de fala: "disse", "afirmou", "declarou" ou aspas
      const match = text.match(/"([^"]{40,200})"/);
      if (match) {
        quotes.push({ text: match[1], source: s.platform || s.source || 'Fonte', url: s.url });
      } else if (text.length > 100) {
        // Fallback: pega um trecho relevante
        quotes.push({ text: text.substring(0, 150) + "...", source: s.platform || s.source || 'Fonte', url: s.url });
      }
    });

    return quotes.filter((v, i, a) => a.findIndex(t => t.text === v.text) === i);
  }
}

export const humanizerEngine = new HumanizerEngine();
