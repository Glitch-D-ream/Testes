import { logInfo, logWarn } from '../core/logger.ts';

export interface FilteredSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  justification: string;
  promiseStrength: 'strong' | 'medium' | 'weak';
  credibilityLayer: 'A' | 'B' | 'C';
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
      const layer = source.credibilityLayer || 'B';
      
      // Heurística simples para pré-filtragem (passando título também)
      if (this.simpleHeuristic(content, flexibleMode, title)) {
        // Determinar força da promessa baseada na camada e conteúdo
        let strength: 'strong' | 'medium' | 'weak' = 'medium';
        if (layer === 'A') strength = 'strong';
        else if (layer === 'C') strength = 'weak';

        filtered.push({
          title: source.title,
          url: source.url,
          content: content,
          source: source.source,
          publishedAt: source.publishedAt,
          credibilityLayer: layer,
          promiseStrength: strength,
          justification: `[Camada ${layer}] Detectado potencial compromisso ou posicionamento político relevante.`
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
      'assine já', 'newsletter', 'erro 404', 'página não encontrada',
      'just a moment', 'enable javascript'
    ];
    if (noiseKeywords.some(kw => combinedText.includes(kw))) return false;
    
    // 1.1. Prioridade para Google News (Sempre aceitar se tiver contexto político)
    if (titleLower.includes('google news') || combinedText.includes('google news')) {
      const politicalKeywords = ['governo', 'política', 'projeto', 'lei', 'lula', 'bolsonaro', 'eleição', 'estado'];
      if (politicalKeywords.some(kw => combinedText.includes(kw))) return true;
    }
    
    // 2. Bloqueio de Perfis Estáticos (Câmara/Senado) sem conteúdo de ação
    const isStaticProfile = titleLower.includes('perfil oficial') || 
                           (combinedText.includes('deputado') && combinedText.includes('biografia'));
    const hasAction = ['vou', 'prometo', 'projeto', 'anunciou', 'investir', 'voto', 'lei'].some(kw => combinedText.includes(kw));
    
    if (isStaticProfile && !hasAction) return false;

    // 3. Critério de Tamanho Mínimo (Reduzido conforme DeepSeek)
    if (combinedText.length < 30) return false;

    // 4. Critério de Relevância Política Básica (Expandido conforme DeepSeek)
    const politicalKeywords = [
      'governo', 'política', 'projeto', 'lei', 'verba', 'orçamento', 
      'eleição', 'candidato', 'partido', 'ministro', 'deputado', 'senador',
      'brasileiro', 'brasil', 'estado', 'público', 'social', 'história',
      'comunista', 'militante', 'escritor', 'professor', 'pernambuco',
      'youtuber', 'marxista', 'pcb', 'candidatura', 'investimento', 'anúncio',
      'gestão', 'administração', 'políticas', 'programa', 'ação', 'medida',
      'iniciativa', 'proposta', 'agenda', 'trabalho', 'desenvolvimento',
      'sociedade', 'nação', 'município', 'fiscal', 'tributário', 'vou', 'prometo'
    ];
    
    const hasPoliticalContext = politicalKeywords.some(kw => combinedText.includes(kw));
    
    // Se for de um portal de elite conhecido, aceitamos com menos rigor
    const eliteDomains = ['estadao.com.br', 'folha.uol.com.br', 'g1.globo.com', 'cnnbrasil.com.br', 'veja.abril.com.br', 'jovempan.com.br', 'gazetadopovo.com.br'];
    const isElite = eliteDomains.some(d => combinedText.includes(d));

    return hasPoliticalContext || (isElite && combinedText.length > 30);
  }
}

export const filterAgent = new FilterAgent();
