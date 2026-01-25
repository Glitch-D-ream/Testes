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
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = (titleLower + ' ' + contentLower).trim();

    // 1. Bloqueio de Ruído Óbvio (Blacklist)
    const noiseKeywords = [
      'cookies', 'privacidade', 'todos os direitos', 'clique aqui', 
      'assine já', 'newsletter', 'erro 404', 'página não encontrada'
    ];
    if (noiseKeywords.some(kw => combinedText.includes(kw))) return false;
    
    // 2. Bloqueio de Perfis Estáticos (Câmara/Senado) sem conteúdo de ação
    const isStaticProfile = titleLower.includes('perfil oficial') || 
                           (combinedText.includes('deputado') && combinedText.includes('biografia'));
    const hasAction = ['vou', 'prometo', 'projeto', 'anunciou', 'investir', 'voto', 'lei'].some(kw => combinedText.includes(kw));
    
    if (isStaticProfile && !hasAction) return false;

    // 3. Critério de Tamanho Mínimo
    if (combinedText.length < 50) return false;

    // 4. Critério de Relevância Política Básica (Expandido)
    const politicalKeywords = [
      'governo', 'política', 'projeto', 'lei', 'verba', 'orçamento', 
      'eleição', 'candidato', 'partido', 'ministro', 'deputado', 'senador',
      'brasileiro', 'brasil', 'estado', 'público', 'social', 'história',
      'comunista', 'militante', 'escritor', 'professor', 'pernambuco',
      'youtuber', 'marxista', 'pcb', 'candidatura'
    ];
    
    return politicalKeywords.some(kw => combinedText.includes(kw));
  }
}

export const filterAgent = new FilterAgent();
