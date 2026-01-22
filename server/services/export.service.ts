import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AnalysisService } from './analysis.service.js';

export class ExportService {
  private analysisService = new AnalysisService();

  async generateAnalysisPDF(analysisId: string): Promise<Buffer> {
    const analysis = await this.analysisService.getAnalysisById(analysisId);
    if (!analysis) throw new Error('Análise não encontrada');

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(22);
    doc.text('Relatório de Análise de Promessa', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`ID: ${analysis.id}`, 20, 35);
    doc.text(`Autor: ${analysis.author || 'Não informado'}`, 20, 42);
    doc.text(`Data: ${new Date(analysis.created_at).toLocaleDateString('pt-BR')}`, 20, 49);
    doc.text(`Score de Probabilidade: ${(analysis.probability_score * 100).toFixed(1)}%`, 20, 56);

    // Texto Original
    doc.setFontSize(14);
    doc.text('Texto Analisado:', 20, 70);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(analysis.text, 170);
    doc.text(splitText, 20, 77);

    // Tabela de Promessas
    const tableData = analysis.promises.map((p: any) => [
      p.promise_text,
      p.category || 'Geral',
      `${(p.confidence_score * 100).toFixed(0)}%`,
      p.negated ? 'Sim' : 'Não',
      p.conditional ? 'Sim' : 'Não'
    ]);

    (doc as any).autoTable({
      startY: 100,
      head: [['Promessa', 'Categoria', 'Confiança', 'Negada', 'Condicional']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Metodologia
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text('Metodologia:', 20, finalY + 20);
    doc.setFontSize(9);
    const methodology = 'Esta análise utiliza Processamento de Linguagem Natural e Inteligência Artificial para identificar padrões linguísticos, compromissos e viabilidade orçamentária baseada em dados públicos.';
    doc.text(doc.splitTextToSize(methodology, 170), 20, finalY + 27);

    return Buffer.from(doc.output('arraybuffer'));
  }
}

export const exportService = new ExportService();
