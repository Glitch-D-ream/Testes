import { logInfo, logWarn, logError } from '../core/logger.js';
import { getDeputadoId, getVotacoesDeputado } from '../integrations/camara.js';
import { getSenadorCodigo, getVotacoesSenador } from '../integrations/senado.js';

export interface IncoherenceAnalysis {
  hasIncoherence: boolean;
  contradictions: Contradiction[];
  coherenceScore: number; // 0-100, onde 100 = totalmente coerente
  summary: string;
}

export interface Contradiction {
  promiseText: string;
  votedAgainstOn: string; // Data da votação
  votedAgainstBill: string; // Projeto votado
  billUrl: string;
  severity: 'low' | 'medium' | 'high'; // Baseado na relevância
  explanation: string;
}

/**
 * Temporal Incoherence Service: Detecta contradições entre promessas e histórico legislativo
 * Implementa o "Diz vs Faz" - quando o político promete algo mas votou diferente antes
 */
export class TemporalIncoherenceService {
  /**
   * Analisar incoerência temporal de um político
   */
  async analyzeIncoherence(politicianName: string, promises: string[]): Promise<IncoherenceAnalysis> {
    logInfo(`[TemporalIncoherence] Analisando incoerência temporal para: ${politicianName}`);

    const contradictions: Contradiction[] = [];

    try {
      // Tentar buscar como Deputado Federal
      let votacoes = await this.getDeputadoVotacoes(politicianName);

      // Se não encontrar, tentar como Senador
      if (!votacoes || votacoes.length === 0) {
        votacoes = await this.getSenadorVotacoes(politicianName);
      }

      if (!votacoes || votacoes.length === 0) {
        logWarn(`[TemporalIncoherence] Nenhum histórico legislativo encontrado para: ${politicianName}`);
        return {
          hasIncoherence: false,
          contradictions: [],
          coherenceScore: 100, // Sem dados, assume coerência
          summary: 'Sem histórico legislativo disponível para análise de incoerência.'
        };
      }

      // Analisar cada promessa contra o histórico de votações
      for (const promise of promises) {
        const promiseKeywords = this.extractKeywords(promise);

        for (const votacao of votacoes) {
          const votacaoKeywords = this.extractKeywords(votacao.descricao || votacao.nome || '');

          // Verificar relevância temática
          const relevanceScore = this.calculateRelevance(promiseKeywords, votacaoKeywords);

          if (relevanceScore > 0.6) {
            // Se o político votou CONTRA uma pauta relacionada à promessa
            if (votacao.voto === 'Não' || votacao.voto === 'Abstenção') {
              contradictions.push({
                promiseText: promise,
                votedAgainstOn: votacao.data || new Date().toISOString(),
                votedAgainstBill: votacao.nome || 'Projeto não identificado',
                billUrl: votacao.url || `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${votacao.id}`,
                severity: this.calculateSeverity(relevanceScore),
                explanation: `O político votou "${votacao.voto}" em ${votacao.data} sobre "${votacao.nome}", o que contradiz a promessa: "${promise}"`
              });
            }
          }
        }
      }

      // Calcular score de coerência
      const coherenceScore = this.calculateCoherenceScore(promises.length, contradictions.length);

      const summary = contradictions.length === 0
        ? `Nenhuma contradição detectada. Histórico legislativo alinhado com as promessas.`
        : `${contradictions.length} contradição(ões) detectada(s) entre promessas e histórico legislativo.`;

      logInfo(`[TemporalIncoherence] Análise concluída. Score de coerência: ${coherenceScore}%`);

      return {
        hasIncoherence: contradictions.length > 0,
        contradictions,
        coherenceScore,
        summary
      };
    } catch (error) {
      logError(`[TemporalIncoherence] Erro na análise de incoerência`, error as Error);
      return {
        hasIncoherence: false,
        contradictions: [],
        coherenceScore: 100,
        summary: 'Erro ao analisar incoerência temporal. Análise indisponível.'
      };
    }
  }

  /**
   * Buscar votações de um Deputado Federal
   */
  private async getDeputadoVotacoes(name: string): Promise<any[]> {
    try {
      const deputadoId = await getDeputadoId(name);
      if (!deputadoId) return [];

      const votacoes = await getVotacoesDeputado(deputadoId);
      return votacoes || [];
    } catch (error) {
      logWarn(`[TemporalIncoherence] Erro ao buscar votações de deputado`, error as Error);
      return [];
    }
  }

  /**
   * Buscar votações de um Senador
   */
  private async getSenadorVotacoes(name: string): Promise<any[]> {
    try {
      const senadorCodigo = await getSenadorCodigo(name);
      if (!senadorCodigo) return [];

      const votacoes = await getVotacoesSenador(senadorCodigo);
      return votacoes || [];
    } catch (error) {
      logWarn(`[TemporalIncoherence] Erro ao buscar votações de senador`, error as Error);
      return [];
    }
  }

  /**
   * Extrair palavras-chave de um texto
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];

    const stopwords = ['o', 'a', 'de', 'para', 'com', 'em', 'é', 'que', 'e', 'do', 'da', 'ou', 'por', 'um', 'uma', 'os', 'as', 'dos', 'das'];
    
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.includes(word))
      .slice(0, 10); // Limitar a 10 palavras principais
  }

  /**
   * Calcular relevância entre dois conjuntos de palavras-chave
   */
  private calculateRelevance(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const intersection = keywords1.filter(k => keywords2.includes(k)).length;
    const union = new Set([...keywords1, ...keywords2]).size;

    return intersection / union; // Índice de Jaccard
  }

  /**
   * Calcular severidade da contradição
   */
  private calculateSeverity(relevanceScore: number): 'low' | 'medium' | 'high' {
    if (relevanceScore > 0.8) return 'high';
    if (relevanceScore > 0.7) return 'medium';
    return 'low';
  }

  /**
   * Calcular score geral de coerência
   */
  private calculateCoherenceScore(totalPromises: number, contradictions: number): number {
    if (totalPromises === 0) return 100;
    return Math.max(0, 100 - (contradictions / totalPromises) * 100);
  }
}

export const temporalIncoherenceService = new TemporalIncoherenceService();
