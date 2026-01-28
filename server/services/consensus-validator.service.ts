
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from './ai-resilience-nexus.ts';

export interface ValidationResult {
  model1: string;
  model2: string;
  verdict1: any;
  verdict2: any;
  consensusScore: number; // 0-100: quanto os vereditos concordam
  disagreementAreas: string[];
  finalVerdict: any; // Veredito final após validação
  judgeReasoning?: string;
}

export class ConsensusValidatorService {
  /**
   * Executa o mesmo prompt em dois modelos diferentes e compara os resultados
   */
  async validateWithCrossModel(prompt: string): Promise<ValidationResult> {
    logInfo(`[ConsensusValidator] Iniciando validação cruzada de veredito...`);
    
    let verdict1: any;
    let verdict2: any;
    let model1 = 'Modelo1';
    let model2 = 'Modelo2';

    try {
      // Primeira IA
      logInfo(`[ConsensusValidator] Gerando veredito via Modelo 1...`);
      const response1 = await aiResilienceNexus.chat(prompt);
      model1 = `${response1.provider}/${response1.model}`;
      
      try {
        verdict1 = JSON.parse(response1.content);
      } catch {
        verdict1 = { raw: response1.content };
      }

      // Segunda IA (tenta um modelo diferente)
      logInfo(`[ConsensusValidator] Gerando veredito via Modelo 2...`);
      const response2 = await aiResilienceNexus.chat(prompt);
      model2 = `${response2.provider}/${response2.model}`;
      
      try {
        verdict2 = JSON.parse(response2.content);
      } catch {
        verdict2 = { raw: response2.content };
      }

      // Comparar vereditos
      const consensusScore = this.calculateConsensusScore(verdict1, verdict2);
      const disagreementAreas = this.identifyDisagreements(verdict1, verdict2);

      logInfo(`[ConsensusValidator] Consenso: ${consensusScore}%. Áreas de discordância: ${disagreementAreas.length}`);

      // Se consenso baixo, usar LLM-as-a-Judge
      let finalVerdict = verdict1; // Padrão
      let judgeReasoning = '';

      if (consensusScore < 80 && disagreementAreas.length > 0) {
        logWarn(`[ConsensusValidator] Consenso baixo (${consensusScore}%). Acionando Pollux-Judge...`);
        const judgeResult = await this.runJudge(verdict1, verdict2, disagreementAreas);
        finalVerdict = judgeResult.verdict;
        judgeReasoning = judgeResult.reasoning;
      }

      return {
        model1,
        model2,
        verdict1,
        verdict2,
        consensusScore,
        disagreementAreas,
        finalVerdict,
        judgeReasoning
      };
    } catch (error) {
      logError(`[ConsensusValidator] Erro na validação cruzada:`, error as Error);
      throw error;
    }
  }

  /**
   * Calcula o score de consenso entre dois vereditos
   */
  private calculateConsensusScore(verdict1: any, verdict2: any): number {
    if (!verdict1 || !verdict2) return 0;

    const keys1 = Object.keys(verdict1);
    const keys2 = Object.keys(verdict2);

    if (keys1.length === 0 || keys2.length === 0) return 0;

    let matches = 0;
    const commonKeys = keys1.filter(k => keys2.includes(k));

    for (const key of commonKeys) {
      const val1 = JSON.stringify(verdict1[key]);
      const val2 = JSON.stringify(verdict2[key]);
      if (val1 === val2) matches++;
    }

    return Math.round((matches / Math.max(commonKeys.length, 1)) * 100);
  }

  /**
   * Identifica áreas de discordância entre vereditos
   */
  private identifyDisagreements(verdict1: any, verdict2: any): string[] {
    const disagreements: string[] = [];
    const keys1 = Object.keys(verdict1);
    const keys2 = Object.keys(verdict2);
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
      const val1 = JSON.stringify(verdict1[key]);
      const val2 = JSON.stringify(verdict2[key]);
      if (val1 !== val2) {
        disagreements.push(`${key}: "${val1}" vs "${val2}"`);
      }
    }

    return disagreements;
  }

  /**
   * Usa um terceiro modelo (Pollux-Judge) para desempatar
   */
  private async runJudge(verdict1: any, verdict2: any, disagreements: string[]): Promise<{ verdict: any; reasoning: string }> {
    const judgePrompt = `
      Você é um juiz imparcial de vereditos de auditoria forense.
      
      Veredito 1:
      ${JSON.stringify(verdict1, null, 2)}
      
      Veredito 2:
      ${JSON.stringify(verdict2, null, 2)}
      
      Áreas de Discordância:
      ${disagreements.join('\n')}
      
      Analise ambos os vereditos e escolha qual é mais confiável e por quê.
      Responda APENAS JSON:
      {
        "chosenVerdict": 1 ou 2,
        "reasoning": "Por que este veredito é mais confiável",
        "credibilityScore": 0-100
      }
    `;

    try {
      const response = await aiResilienceNexus.chat(judgePrompt);
      const judgeResult = JSON.parse(response.content);
      const chosenVerdict = judgeResult.chosenVerdict === 1 ? verdict1 : verdict2;
      return {
        verdict: chosenVerdict,
        reasoning: judgeResult.reasoning
      };
    } catch (error) {
      logError(`[ConsensusValidator] Erro no Judge:`, error as Error);
      return {
        verdict: verdict1,
        reasoning: 'Fallback para Veredito 1 devido a erro no Judge'
      };
    }
  }
}

export const consensusValidatorService = new ConsensusValidatorService();
