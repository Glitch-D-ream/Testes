
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { getDeputadoId, getVotacoesDeputado, getProposicoesDeputado } from '../integrations/camara.ts';
import { getSenadorCodigo, getVotacoesSenador, getMateriasSenador } from '../integrations/senado.ts';

export interface NegativeEvidenceAnalysis {
  politicianName: string;
  promiseText: string;
  category: string;
  evidenceFound: boolean;
  negativeEvidenceScore: number; // 0-100, onde 100 = ausência total de esforço
  details: {
    totalVotesFound: number;
    relevantVotesFound: number;
    totalProjectsFound: number;
    relevantProjectsFound: number;
    explanation: string;
  };
}

/**
 * Negative Evidence Service: Detecta a AUSÊNCIA de esforço compatível com uma promessa.
 * Implementa a lógica de "Contraste" sugerida: se prometeu X e não há nada sobre X no histórico, 
 * a promessa é considerada de baixa viabilidade/compromisso.
 */
export class NegativeEvidenceService {
  
  async analyzeContrast(politicianName: string, promiseText: string, category: string): Promise<NegativeEvidenceAnalysis> {
    logInfo(`[NegativeEvidence] Analisando contraste para: ${politicianName} | Promessa: ${promiseText.substring(0, 50)}...`);

    try {
      // 1. Buscar histórico legislativo completo
      const [votes, projects] = await this.getLegislativeHistory(politicianName);

      // 2. Definir palavras-chave baseadas na categoria e na promessa
      const keywords = this.getKeywordsForCategory(category, promiseText);

      // 3. Filtrar histórico relevante
      const relevantVotes = votes.filter(v => 
        keywords.some(k => (v.ementa || v.descricao || '').toLowerCase().includes(k))
      );

      const relevantProjects = projects.filter(p => 
        keywords.some(k => (p.ementa || '').toLowerCase().includes(k))
      );

      // 4. Calcular Score de Ausência (Negative Evidence Score)
      // Se não houver votos nem projetos relevantes, o score é alto (máxima ausência de esforço)
      let negativeScore = 0;
      if (relevantVotes.length === 0 && relevantProjects.length === 0) {
        negativeScore = 100;
      } else if (relevantVotes.length === 0 || relevantProjects.length === 0) {
        negativeScore = 50;
      } else {
        negativeScore = Math.max(0, 100 - (relevantVotes.length * 10 + relevantProjects.length * 20));
      }

      const evidenceFound = relevantVotes.length > 0 || relevantProjects.length > 0;
      
      let explanation = '';
      if (!evidenceFound) {
        explanation = `Não foi encontrada nenhuma evidência de esforço legislativo (votos ou projetos) do político ${politicianName} relacionada ao tema "${category}" nos registros oficiais recentes.`;
      } else {
        explanation = `Foram encontrados ${relevantProjects.length} projetos e ${relevantVotes.length} votações do político ${politicianName} relacionados ao tema "${category}".`;
      }

      return {
        politicianName,
        promiseText,
        category,
        evidenceFound,
        negativeEvidenceScore: negativeScore,
        details: {
          totalVotesFound: votes.length,
          relevantVotesFound: relevantVotes.length,
          totalProjectsFound: projects.length,
          relevantProjectsFound: relevantProjects.length,
          explanation
        }
      };

    } catch (error) {
      logError(`[NegativeEvidence] Erro na análise de contraste`, error as Error);
      throw error;
    }
  }

  private async getLegislativeHistory(name: string): Promise<[any[], any[]]> {
    const [depId, senId] = await Promise.all([
      getDeputadoId(name),
      getSenadorCodigo(name)
    ]);

    let votes: any[] = [];
    let projects: any[] = [];

    if (depId) {
      const [v, p] = await Promise.all([
        getVotacoesDeputado(depId),
        getProposicoesDeputado(depId)
      ]);
      votes = [...votes, ...v];
      projects = [...projects, ...p];
    }

    if (senId) {
      const [v, p] = await Promise.all([
        getVotacoesSenador(senId),
        getMateriasSenador(senId)
      ]);
      votes = [...votes, ...v];
      projects = [...projects, ...p];
    }

    return [votes, projects];
  }

  private getKeywordsForCategory(category: string, promiseText: string): string[] {
    const categoryKeywords: Record<string, string[]> = {
      'HEALTH': ['saúde', 'hospital', 'sus', 'médico', 'vacina', 'medicamento', 'enfermagem'],
      'EDUCATION': ['educação', 'escola', 'ensino', 'professor', 'universidade', 'creche', 'alfabetização'],
      'ECONOMY': ['economia', 'imposto', 'tributo', 'fiscal', 'orçamento', 'gasto', 'renda', 'salário'],
      'SECURITY': ['segurança', 'polícia', 'crime', 'violência', 'armas', 'presídio', 'penal'],
      'SOCIAL': ['social', 'pobreza', 'fome', 'auxílio', 'habitação', 'moradia', 'lgbtqia+', 'mulher', 'negro'],
      'INFRASTRUCTURE': ['infraestrutura', 'obra', 'estrada', 'ponte', 'asfalto', 'saneamento', 'energia']
    };

    const baseKeywords = categoryKeywords[category] || [];
    
    // Extrair palavras importantes da promessa (simples)
    const promiseWords = promiseText.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 5)
      .slice(0, 5);

    return Array.from(new Set([...baseKeywords, ...promiseWords]));
  }
}

export const negativeEvidenceService = new NegativeEvidenceService();
