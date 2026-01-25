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
      const title = source.title || '';
      
      // Heurística simples para pré-filtragem (passando título também)
      if (this.simpleHeuristic(content, flexibleMode, title)) {
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

  private simpleHeuristic(content: string, flexibleMode: boolean = false, title: string = ''): boolean {
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
    const titleLower = title.toLowerCase();
    const combinedText = (titleLower + ' ' + contentLower).trim();

    // Bloqueio de Ruído (Blacklist)
    const noiseKeywords = [
      'publicidade', 'anúncio', 'cookies', 'privacidade', 'todos os direitos',
      'clique aqui', 'assine já', 'newsletter', 'fallback', 'generic search',
      'não encontrado', 'erro 404', 'página não encontrada'
    ];
    const isNoise = noiseKeywords.some(kw => combinedText.includes(kw));
    if (isNoise) return false;
    
    const hasAction = actionVerbs.some(kw => combinedText.includes(kw));
    const hasContext = politicalContext.some(kw => combinedText.includes(kw));

    // MODO REFINADO: Exige ação OU contexto político forte, e ignora textos curtos ou puramente biográficos
    const isTooShort = content.length < 60; // Reduzido de 100 para 60 para aceitar snippets curtos mas densos
    
    // Verifica se o conteúdo ou o título indicam um perfil biográfico sem ação
    // Tornamos a detecção de biografia mais específica para não pegar notícias que mencionam "deputado"
    const isBiographical = (combinedText.includes('perfil:') || combinedText.includes('biografia')) && 
                          (combinedText.includes('email') || combinedText.includes('partido') || combinedText.includes('sigla'));
    
    // Se for biográfico, SÓ aceita se tiver uma ação MUITO clara
    const hasStrongAction = ['prometo', 'vou investir', 'farei', 'projeto de lei', 'candidato', 'eleição', 'voto', 'anunciou', 'garantiu'].some(kw => combinedText.includes(kw));

    if (isBiographical && !hasStrongAction) return false;
    
    // Se for muito curto e não tiver nada de útil, descarta
    if (isTooShort && !hasAction && !hasContext) return false;

    // Se o conteúdo for puramente informativo/biográfico da Câmara (URL oficial de perfil), descarta
    if (titleLower.includes('perfil oficial') && combinedText.includes('deputado') && !hasStrongAction) return false;

    // Aceita se tiver ação OU se tiver contexto político e tamanho razoável
    return hasAction || (hasContext && content.length > 80);
  }
}

export const filterAgent = new FilterAgent();
