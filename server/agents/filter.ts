import axios from 'axios';
import { RawSource } from './scout.js';
import { logInfo, logError } from '../core/logger.js';

export interface FilteredSource extends RawSource {
  relevanceScore: number;
  isPromise: boolean;
  justification: string;
}

export class FilterAgent {
  /**
   * Filtra e limpa os dados brutos usando uma IA leve para classificação
   */
  async filter(sources: RawSource[]): Promise<FilteredSource[]> {
    logInfo(`[Filter] Analisando relevância de ${sources.length} fontes...`);
    
    // 1. Remover duplicatas por URL
    const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    
    const filteredResults: FilteredSource[] = [];

    for (const source of uniqueSources) {
      try {
        // Usamos uma chamada rápida de IA para decidir se o conteúdo é uma promessa
        // Isso evita que o "Brain" (IA cara) processe lixo.
        const isRelevant = await this.checkRelevance(source);
        
        if (isRelevant.isPromise) {
          filteredResults.push({
            ...source,
            relevanceScore: isRelevant.score,
            isPromise: true,
            justification: isRelevant.reason
          });
        }
      } catch (error) {
        logError(`[Filter] Erro ao filtrar fonte: ${source.url}`, error as Error);
        // Fallback: se a IA falhar, usamos uma heurística simples de palavras-chave
        if (this.simpleHeuristic(source.content)) {
          filteredResults.push({
            ...source,
            relevanceScore: 0.5,
            isPromise: true,
            justification: 'Aprovado por heurística de palavras-chave (Fallback)'
          });
        }
      }
    }

    logInfo(`[Filter] Refino concluído. ${filteredResults.length} fontes úteis para o Brain.`);
    return filteredResults;
  }

  private async checkRelevance(source: RawSource): Promise<{ isPromise: boolean, score: number, reason: string }> {
    const prompt = `Analise se o texto abaixo contém uma promessa política, plano de governo ou compromisso público.
    Texto: "${source.content}"
    Responda apenas JSON: {"isPromise": boolean, "score": 0-1, "reason": "string"}`;

    const response = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'system', content: 'Você é um classificador de dados políticos. Responda apenas JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      jsonMode: true
    }, { timeout: 15000 });

    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data.replace(/```json\n?|\n?```/g, '').trim());
    }
    return data;
  }

  private simpleHeuristic(content: string): boolean {
    const keywords = ['vou', 'vamos', 'prometo', 'farei', 'projeto', 'plano', 'investir', 'construir'];
    const contentLower = content.toLowerCase();
    return keywords.some(kw => contentLower.includes(kw));
  }
}

export const filterAgent = new FilterAgent();
