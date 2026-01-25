import axios from 'axios';
import { RawSource } from './scout.ts';
import { logInfo, logError } from '../core/logger.ts';

export interface FilteredSource extends RawSource {
  relevanceScore: number;
  isPromise: boolean;
  justification: string;
}

export class FilterAgent {
  /**
   * Filtra e limpa os dados brutos usando uma IA leve com processamento em lote
   * Modo flexível: aceita menções relevantes além de promessas explícitas
   */
  async filter(sources: RawSource[], flexibleMode: boolean = false): Promise<FilteredSource[]> {
    logInfo(`[Filter] Analisando relevância de ${sources.length} fontes (Modo: ${flexibleMode ? 'FLEXÍVEL' : 'RIGOROSO'})...`);
    
    // 1. Remover duplicatas por URL
    const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    
    // 2. Pré-filtragem por heurística (mais flexível se flexibleMode)
    const candidates = uniqueSources.filter(source => 
      this.simpleHeuristic(source.title + " " + source.content, flexibleMode)
    );
    
    if (candidates.length === 0) {
      logInfo(`[Filter] Nenhuma fonte passou na heurística inicial.`);
      // Em modo flexível, retornar todas as fontes com score baixo
      if (flexibleMode && uniqueSources.length > 0) {
        logInfo(`[Filter] Modo flexível: aceitando todas as fontes com score reduzido.`);
        return uniqueSources.map(source => ({
          ...source,
          relevanceScore: 0.3,
          isPromise: false,
          justification: 'Menção relevante (Modo Flexível)'
        }));
      }
      return [];
    }

    logInfo(`[Filter] ${candidates.length} fontes passaram na heurística. Iniciando análise em lote via IA...`);

    try {
      // 3. Processamento em Lote (Batch) via IA
      const filteredResults = await this.checkRelevanceBatch(candidates, flexibleMode);
      
      logInfo(`[Filter] Refino concluído. ${filteredResults.length} fontes úteis para o Brain.`);
      return filteredResults;
    } catch (error) {
      logError(`[Filter] Erro no processamento em lote. Usando fallback individual...`, error as Error);
      
      // Fallback: aceitar candidatos com score reduzido
      return candidates.map(source => ({
        ...source,
        relevanceScore: flexibleMode ? 0.4 : 0.5,
        isPromise: true,
        justification: flexibleMode ? 'Menção relevante (Fallback Flexível)' : 'Aprovado por heurística (Fallback)'
      }));
    }
  }

  /**
   * Analisa um lote de fontes em uma única chamada de IA
   */
  private async checkRelevanceBatch(sources: RawSource[], flexibleMode: boolean = false): Promise<FilteredSource[]> {
    // Preparar o lote para o prompt
    const batchData = sources.map((s, idx) => ({
      id: idx,
      text: `${s.title}: ${s.content.substring(0, 300)}...`
    }));

    const prompt = `Você é um Analista de Triagem de Dados Públicos. Sua tarefa é filtrar as notícias abaixo com base em CRITÉRIOS TÉCNICOS de utilidade para auditoria.

### CRITÉRIOS DE INCLUSÃO:
1. **Compromisso de Ação:** Declarações que indicam uma ação futura (ex: "Vou construir", "Reduziremos").
2. **Anúncio de Política Pública:** Lançamento de programas, obras ou mudanças legislativas.
3. **Posicionamento e Defesa:** Defesa de projetos de lei, causas sociais ou propostas parlamentares (ex: "Defendo a lei X", "Apresentamos o projeto Y").
4. **Dados Concretos:** Notícias que citam valores, prazos ou metas específicas.

### CRITÉRIOS DE EXCLUSÃO (IMPARCIALIDADE):
1. **Opinião/Retórica Pura:** Críticas a adversários ou elogios a aliados sem proposta de ação.
2. **Vida Pessoal/Protocolar:** Eventos sociais, agendas de viagens sem pauta técnica ou fofocas.
3. **Viés Editorial:** Ignore o tom do jornalista; foque apenas na declaração direta do agente político.

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

  private simpleHeuristic(content: string, flexibleMode: boolean = false): boolean {
    const actionVerbs = [
      'vou', 'vamos', 'prometo', 'farei', 'irei', 'pretendo', 'planejo',
      'investir', 'construir', 'obras', 'edital', 'lançar', 'reforma', 
      'ampliar', 'criar', 'reduzir', 'aumentar', 'implementar', 'entregar',
      'contratar', 'destinar', 'aplicar', 'baixar', 'cortar', 'eliminar',
      'defendo', 'proponho', 'apresento', 'queremos', 'objetivo', 'meta',
      'projeto', 'lei', 'votação', 'parlamentar', 'deputado', 'senador'
    ];
    
    const politicalContext = [
      'governo', 'prefeitura', 'estado', 'município', 'verba', 'orçamento',
      'povo', 'cidadão', 'eleitor', 'campanha', 'mandato', 'gestão',
      'política', 'pública', 'direitos', 'social', 'saúde', 'educação'
    ];

    const contentLower = content.toLowerCase();
    
    // Heurística mais robusta: Verbo de ação + Contexto Político OU Verbo de ação forte
    const hasAction = actionVerbs.some(kw => contentLower.includes(kw));
    const hasContext = politicalContext.some(kw => contentLower.includes(kw));
    
    // Se tiver um verbo de ação forte (ex: "vou construir"), já é um bom candidato
    const strongActions = ['vou', 'prometo', 'farei', 'irei', 'construir', 'investir'];
    const hasStrongAction = strongActions.some(kw => contentLower.includes(kw));

    if (flexibleMode) {
      return hasAction || hasContext || contentLower.includes('politico') || contentLower.includes('governo');
    }

    // Aumentando a sensibilidade: se tiver ação OU contexto forte, já passa para a IA analisar
    return hasAction || hasContext || hasStrongAction;
  }
}

export const filterAgent = new FilterAgent();
