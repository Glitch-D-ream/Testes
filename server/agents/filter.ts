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
   * Filtra e limpa os dados brutos usando uma IA leve com processamento em lote
   */
  async filter(sources: RawSource[]): Promise<FilteredSource[]> {
    logInfo(`[Filter] Analisando relevância de ${sources.length} fontes...`);
    
    // 1. Remover duplicatas por URL
    const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    
    // 2. Pré-filtragem por heurística simples (NLP Local) para economizar IA
    const candidates = uniqueSources.filter(source => this.simpleHeuristic(source.title + " " + source.content));
    
    if (candidates.length === 0) {
      logInfo(`[Filter] Nenhuma fonte passou na heurística inicial.`);
      return [];
    }

    logInfo(`[Filter] ${candidates.length} fontes passaram na heurística. Iniciando análise em lote via IA...`);

    try {
      // 3. Processamento em Lote (Batch) via IA
      // Enviamos as fontes em grupos para economizar chamadas e tempo
      const filteredResults = await this.checkRelevanceBatch(candidates);
      
      logInfo(`[Filter] Refino concluído. ${filteredResults.length} fontes úteis para o Brain.`);
      return filteredResults;
    } catch (error) {
      logError(`[Filter] Erro no processamento em lote. Usando fallback individual...`, error as Error);
      
      // Fallback: se o lote falhar, tenta processar os candidatos com a heurística aprovada
      return candidates.map(source => ({
        ...source,
        relevanceScore: 0.5,
        isPromise: true,
        justification: 'Aprovado por heurística (Fallback de erro na IA)'
      }));
    }
  }

  /**
   * Analisa um lote de fontes em uma única chamada de IA
   */
  private async checkRelevanceBatch(sources: RawSource[]): Promise<FilteredSource[]> {
    // Preparar o lote para o prompt
    const batchData = sources.map((s, idx) => ({
      id: idx,
      text: `${s.title}: ${s.content.substring(0, 300)}...`
    }));

    const prompt = `Analise quais dos textos abaixo contêm promessas políticas, planos de governo ou compromissos públicos.
    Textos: ${JSON.stringify(batchData)}
    Responda apenas um JSON no formato: {"results": [{"id": number, "isPromise": boolean, "score": number, "reason": "string"}]}`;

    const response = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'system', content: 'Você é um classificador de dados políticos especializado em análise de promessas. Responda apenas JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      jsonMode: true
    }, { timeout: 30000 });

    let data = response.data;
    if (typeof data === 'string') {
      data = JSON.parse(data.replace(/```json\n?|\n?```/g, '').trim());
    }

    const filtered: FilteredSource[] = [];
    if (data && data.results) {
      for (const res of data.results) {
        if (res.isPromise && sources[res.id]) {
          filtered.push({
            ...sources[res.id],
            relevanceScore: res.score,
            isPromise: true,
            justification: res.reason,
            // Garantir que metadados de evidência sejam passados
            content: sources[res.id].content,
            url: sources[res.id].url,
            source: sources[res.id].source
          });
        }
      }
    }

    return filtered;
  }

  private simpleHeuristic(content: string): boolean {
    const actionVerbs = [
      'vou', 'vamos', 'prometo', 'farei', 'irei', 'pretendo', 'planejo',
      'investir', 'construir', 'obras', 'edital', 'lançar', 'reforma', 
      'ampliar', 'criar', 'reduzir', 'aumentar', 'implementar', 'entregar',
      'contratar', 'destinar', 'aplicar', 'baixar', 'cortar', 'eliminar'
    ];
    
    const politicalContext = [
      'governo', 'prefeitura', 'estado', 'município', 'verba', 'orçamento',
      'povo', 'cidadão', 'eleitor', 'campanha', 'mandato', 'gestão'
    ];

    const contentLower = content.toLowerCase();
    
    // Heurística mais robusta: Verbo de ação + Contexto Político OU Verbo de ação forte
    const hasAction = actionVerbs.some(kw => contentLower.includes(kw));
    const hasContext = politicalContext.some(kw => contentLower.includes(kw));
    
    // Se tiver um verbo de ação forte (ex: "vou construir"), já é um bom candidato
    const strongActions = ['vou', 'prometo', 'farei', 'irei', 'construir', 'investir'];
    const hasStrongAction = strongActions.some(kw => contentLower.includes(kw));

    return hasStrongAction || (hasAction && hasContext);
  }
}

export const filterAgent = new FilterAgent();
