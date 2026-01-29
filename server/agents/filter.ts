import { logInfo, logWarn } from '../core/logger.ts';
import { consensusModule } from './consensus.ts';

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
      
      // Heurística simples para pré-filtragem (passando título e nome do alvo se disponível)
      const targetName = (source as any).politicianName || '';
      if (this.simpleHeuristic(content, flexibleMode, title, targetName)) {
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

    // --- Início Checkpoint 1: Módulo Consensus ---
    try {
      logInfo(`[Filter] Iniciando análise de consenso para as fontes filtradas...`);
      const consensusResults = await consensusModule.analyzeConsensus(filtered);
      
      for (const source of filtered) {
        const result = consensusResults.get(source.url);
        if (result) {
          // Ajustar a força da promessa baseado no consenso
          if (result.status === 'verified') {
            source.promiseStrength = 'strong';
            source.justification += ` [VERIFICADO POR CONSENSO]`;
          } else if (result.status === 'divergent') {
            source.promiseStrength = 'weak';
            source.justification += ` [DIVERGÊNCIA DETECTADA]`;
          }
          
          // Adicionar metadados de consenso (serão salvos no banco)
          (source as any).consensus_group = result.group_id;
          (source as any).reliability_score = result.reliability_score;
          (source as any).consensus_status = result.status;
        }
      }
    } catch (error) {
      logWarn(`[Filter] Falha ao processar consenso: ${error}`);
    }
    // --- Fim Checkpoint 1 ---

    return filtered;
  }

  private simpleHeuristic(content: string, flexibleMode: boolean = false, title: string = '', targetName: string = ''): boolean {
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = (titleLower + ' ' + contentLower).trim();
    
    // 0. Validação de Contexto (O político alvo deve ser mencionado)
    if (targetName) {
      const nameParts = targetName.toLowerCase().split(' ').filter(p => p.length > 2);
      const hasName = nameParts.some(part => combinedText.includes(part));
      if (!hasName) return false;
    }

    // 1. Bloqueio de Ruído Óbvio (Blacklist)
    const noiseKeywords = [
      'cookies', 'privacidade', 'todos os direitos', 'clique aqui', 
      'assine já', 'newsletter', 'erro 404', 'página não encontrada',
      'just a moment', 'enable javascript', 'big brother brasil', 'bbb24', 'bbb25',
      'reality show', 'entretenimento', 'fofoca', 'celebridades'
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

    // 3. Critério de Tamanho Mínimo (Aumentado para evitar snippets inúteis)
    if (combinedText.length < 150) return false;

    // 4. Critério de Relevância Política Básica (Expandido conforme DeepSeek)
    const politicalKeywords = [
      'governo', 'política', 'projeto', 'lei', 'verba', 'orçamento', 
      'eleição', 'candidato', 'partido', 'ministro', 'deputado', 'senador',
      'brasileiro', 'brasil', 'estado', 'público', 'social', 'história',
      'comunista', 'militante', 'escritor', 'professor', 'pernambuco',
      'youtuber', 'marxista', 'pcb', 'candidatura', 'investimento', 'anúncio',
      'gestão', 'administração', 'políticas', 'programa', 'ação', 'medida',
      'iniciativa', 'proposta', 'agenda', 'trabalho', 'desenvolvimento',
      'sociedade', 'nação', 'município', 'fiscal', 'tributário', 'vou', 'prometo',
      'entrevista', 'declarou', 'disse', 'afirmou', 'processo', 'judicial',
      'justiça', 'investigação', 'tribunal', 'stf', 'tse', 'condenado', 'absolvido'
    ];
    
    const hasPoliticalContext = politicalKeywords.some(kw => combinedText.includes(kw));
    
    // Se for de um portal de elite conhecido, aceitamos com menos rigor
    const eliteDomains = [
      'estadao.com.br', 'folha.uol.com.br', 'g1.globo.com', 'cnnbrasil.com.br', 
      'veja.abril.com.br', 'jovempan.com.br', 'gazetadopovo.com.br', 'uol.com.br',
      'bbc.com', 'metropoles.com', 'poder360.com.br', 'jusbrasil.com.br', 'conjur.com.br',
      'Estadão', 'G1', 'CNN Brasil', 'Poder360', 'Folha', 'Gazeta do Povo'
    ];
    const isElite = eliteDomains.some(d => combinedText.includes(d));

    // Valorizar entrevistas e processos
    const isInterview = combinedText.includes('entrevista') || (combinedText.match(/"|“|”/g) || []).length > 4;
    const isLegal = combinedText.includes('processo') || combinedText.includes('judicial') || combinedText.includes('stf');

    return hasPoliticalContext || (isElite && combinedText.length > 30) || isInterview || isLegal;
  }
}

export const filterAgent = new FilterAgent();
