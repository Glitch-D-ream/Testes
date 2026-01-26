
import { aiService } from './ai.service.ts';
import { logInfo, logError } from '../core/logger.ts';

export interface ExtractedProjectPromise {
  text: string;
  category: string;
  projectId: string;
  projectTitle: string;
  intent: string;
  impact: string;
}

/**
 * Project Promise Extractor Service: Extrai compromissos públicos de textos técnicos de PLs.
 * Como sugerido pelo ChatGPT, PLs têm linguagem compromissória nas justificativas.
 */
export class ProjectPromiseExtractorService {
  
  async extractFromProject(project: { id: string, sigla: string, numero: string, ano: string, ementa: string }): Promise<ExtractedProjectPromise[]> {
    logInfo(`[ProjectExtractor] Extraindo promessas do projeto: ${project.sigla} ${project.numero}/${project.ano}`);

    const prompt = `
      Analise a ementa deste Projeto de Lei e extraia a principal "promessa" ou "compromisso público" que o autor está assumindo ao propor esta lei.
      
      Projeto: ${project.sigla} ${project.numero}/${project.ano}
      Ementa: ${project.ementa}
      
      Responda em formato JSON:
      {
        "promises": [
          {
            "text": "O que o projeto promete mudar ou criar na prática",
            "category": "ECONOMY/HEALTH/EDUCATION/etc",
            "intent": "A intenção política por trás do projeto",
            "impact": "O impacto esperado na vida do cidadão"
          }
        ]
      }
    `;

    try {
      const aiResponse = await aiService.analyzeText(prompt);
      
      if (!aiResponse.promises || aiResponse.promises.length === 0) {
        return [];
      }

      return aiResponse.promises.map((p: any) => ({
        text: p.text,
        category: p.category,
        projectId: project.id,
        projectTitle: `${project.sigla} ${project.numero}/${project.ano}`,
        intent: p.intent || 'N/A',
        impact: p.impact || 'N/A'
      }));

    } catch (error) {
      logError(`[ProjectExtractor] Erro ao extrair promessas do projeto ${project.id}`, error as Error);
      return [];
    }
  }
}

export const projectPromiseExtractorService = new ProjectPromiseExtractorService();
