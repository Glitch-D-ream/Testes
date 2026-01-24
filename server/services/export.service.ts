import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import nodeHtmlToImage from 'node-html-to-image';
import { AnalysisService } from './analysis.service.js';

export class ExportService {
  private analysisService = new AnalysisService();

  async generateAnalysisImage(analysisId: string): Promise<Buffer> {
    const analysis = await this.analysisService.getAnalysisById(analysisId);
    if (!analysis) throw new Error('Análise não encontrada');

    const score = Math.round((analysis.probability_score || 0) * 100);
    const date = new Date(analysis.created_at).toLocaleDateString('pt-BR');
    
    let level = 'Moderada';
    let color = '#f59e0b'; // yellow-500
    if (score >= 80) { level = 'Altamente Viável'; color = '#10b981'; }
    else if (score >= 60) { level = 'Viável'; color = '#3b82f6'; }
    else if (score >= 20) { level = 'Baixa'; color = '#f97316'; }
    else { level = 'Muito Baixa'; color = '#ef4444'; }

    const html = `
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { width: 1200px; height: 630px; font-family: 'Inter', sans-serif; }
            .card-bg { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
          </style>
        </head>
        <body class="flex items-center justify-center p-0 m-0">
          <div class="card-bg w-full h-full p-12 flex flex-col justify-between text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-4xl font-bold mb-2">Detector de Promessa Vazia</h1>
                <p class="text-blue-200 text-xl">Análise de Viabilidade Política</p>
              </div>
              <div class="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-lg">
                ${date}
              </div>
            </div>

            <div class="flex-1 flex items-center gap-12 my-8">
              <div class="flex-1">
                <div class="bg-white bg-opacity-10 p-6 rounded-2xl border border-white border-opacity-20">
                  <p class="text-blue-100 text-sm uppercase tracking-wider mb-2">Político / Autor</p>
                  <h2 class="text-3xl font-bold mb-4">${analysis.author || 'Não informado'}</h2>
                  <p class="text-blue-100 text-sm uppercase tracking-wider mb-2">Texto Analisado</p>
                  <p class="text-xl italic line-clamp-3">"${analysis.text.substring(0, 180)}${analysis.text.length > 180 ? '...' : ''}"</p>
                </div>
              </div>

              <div class="w-80 flex flex-col items-center justify-center bg-white rounded-3xl p-8 shadow-2xl">
                <p class="text-gray-500 font-bold uppercase text-sm mb-2">Score de Viabilidade</p>
                <div class="text-7xl font-black mb-2" style="color: ${color}">${score}%</div>
                <div class="px-6 py-2 rounded-full text-white font-bold text-lg" style="background-color: ${color}">
                  ${level}
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center border-t border-white border-opacity-10 pt-6">
              <div class="flex gap-8">
                <div>
                  <p class="text-blue-200 text-xs uppercase">Promessas</p>
                  <p class="text-xl font-bold">${analysis.promises?.length || 0}</p>
                </div>
                <div>
                  <p class="text-blue-200 text-xs uppercase">Categoria</p>
                  <p class="text-xl font-bold">${analysis.category || 'Geral'}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-blue-200 text-sm">Acesse a análise completa em:</p>
                <p class="text-lg font-mono font-bold">detector-promessa-vazia.pages.dev</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const image = await nodeHtmlToImage({
      html,
      type: 'jpeg',
      quality: 90,
      puppeteerArgs: {
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    return image as Buffer;
  }

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
