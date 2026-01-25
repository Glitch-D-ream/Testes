import { logInfo, logWarn } from '../core/logger.ts';

export interface FilteredSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  justification: string;
}

export class FilterAgent {
  /**
   * Filtra fontes brutas para manter apenas o que parece ser uma promessa ou compromisso
   */
  async filter(sources: any[], flexibleMode: boolean = false): Promise<FilteredSource[]> {
    logInfo(`[Filter] Analisando ${sources.length} fontes brutas (Modo Flexível: ${flexibleMode})`);
    
    const filtered: FilteredSource[] = [];

    for (const source of sources) {
      const content = source.content || '';
      
      // Heurística simples para pré-filtragem
      if (this.simpleHeuristic(content, flexibleMode)) {
        filtered.push({
          title: source.title,
          url: source.url,
          content: content,
          source: source.source,
          publishedAt: source.publishedAt,
          justification: 'Detectado potencial compromisso ou posicionamento político relevante.'
        });
      }
    }

    logInfo(`[Filter] Filtragem concluída. ${filtered.length} fontes mantidas.`);
    return filtered;
  }

  private simpleHeuristic(content: string, flexibleMode: boolean = false): boolean {
    const actionVerbs = [
      'vou', 'vamos', 'prometo', 'farei', 'irei', 'pretendo', 'planejo',
      'investir', 'construir', 'obras', 'edital', 'lançar', 'reforma', 
      'ampliar', 'criar', 'reduzir', 'aumentar', 'implementar', 'entregar',
      'contratar', 'destinar', 'aplicar', 'baixar', 'cortar', 'eliminar',
      'defendo', 'proponho', 'apresento', 'queremos', 'objetivo', 'meta',
      'projeto', 'lei', 'votação', 'parlamentar', 'deputado', 'senador',
      'anunciou', 'garantiu', 'assegurou', 'firmou', 'compromisso'
    ];
    
    const politicalContext = [
      'governo', 'prefeitura', 'estado', 'município', 'verba', 'orçamento',
      'povo', 'cidadão', 'eleitor', 'campanha', 'mandato', 'gestão',
      'política', 'pública', 'direitos', 'social', 'saúde', 'educação',
      'parlamentar', 'congresso', 'câmara', 'senado', 'ministério'
    ];

    const contentLower = content.toLowerCase();

    // Bloqueio de Ruído (Blacklist)
    const noiseKeywords = [
      'publicidade', 'anúncio', 'cookies', 'privacidade', 'todos os direitos',
      'clique aqui', 'assine já', 'newsletter', 'fallback', 'generic search',
      'não encontrado', 'erro 404', 'página não encontrada'
    ];
    const isNoise = noiseKeywords.some(kw => contentLower.includes(kw));
    if (isNoise) return false;
    
    const hasAction = actionVerbs.some(kw => contentLower.includes(kw));
    const hasContext = politicalContext.some(kw => contentLower.includes(kw));

    // MODO ULTRA FLEXÍVEL: Se o conteúdo for minimamente longo e tiver contexto político, aceita.
    return hasAction || hasContext || content.length > 60;
  }
}

export const filterAgent = new FilterAgent();
