import natural from 'natural';
import compromise from 'compromise';
import logger from '../core/logger';

/**
 * Advanced NLP Module for Promise Analysis
 * 
 * Utiliza:
 * - natural: Tokenização, stemming, análise de frequência
 * - compromise: Análise gramatical, extração de entidades
 * - Regex customizado: Padrões específicos de promessas políticas
 */

interface PromiseAnalysis {
  text: string;
  promises: ExtractedPromise[];
  negations: NegationAnalysis;
  conditions: ConditionAnalysis;
  entities: EntityAnalysis;
  sentiment: SentimentAnalysis;
  confidence: number;
}

interface ExtractedPromise {
  text: string;
  category: string;
  confidence: number;
  negated: boolean;
  conditional: boolean;
  scope: string;
  action: string;
  target: string;
}

interface NegationAnalysis {
  hasNegation: boolean;
  negations: string[];
  confidence: number;
}

interface ConditionAnalysis {
  hasCondition: boolean;
  conditions: string[];
  type: 'if' | 'when' | 'unless' | 'if_elected' | 'if_appointed' | 'none';
  confidence: number;
}

interface EntityAnalysis {
  locations: string[];
  organizations: string[];
  numbers: string[];
  dates: string[];
}

interface SentimentAnalysis {
  score: number; // -1 a 1
  magnitude: number; // 0 a 1
  type: 'positive' | 'negative' | 'neutral';
}

// Padrões de promessas políticas em português
const PROMISE_PATTERNS = {
  // Ações diretas
  CONSTRUCTION: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:construir|edificar|erguer|levantar)\s+(\d+\s+)?(?:escolas?|hospitais?|creches?|postos?|centros?|praças?|parques?|ruas?|avenidas?|estradas?|pontes?|viadutos?)/gi,
  HIRING: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:contratar|empregar|recrutar|admitir)\s+(\d+\s+)?(?:professores?|médicos?|enfermeiros?|policiais?|bombeiros?|agentes?|funcionários?|trabalhadores?)/gi,
  INVESTMENT: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:investir|aplicar|destinar|alocar)\s+(?:R\$\s+)?[\d.,]+\s+(?:bilhões?|milhões?|mil)?\s+(?:em|para|na|no)\s+(\w+)/gi,
  REDUCTION: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:reduzir|diminuir|cortar|eliminar)\s+(?:impostos?|taxas?|tarifas?|preços?|custos?|gastos?|despesas?)/gi,
  INCREASE: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:aumentar|elevar|melhorar|incrementar)\s+(?:salários?|benefícios?|aposentadorias?|pensões?|bolsas?|auxílios?)/gi,
  IMPROVEMENT: /(?:vou|irei|vamos|iremos|será|serão)\s+(?:melhorar|aprimorar|otimizar|modernizar)\s+(?:educação|saúde|segurança|transporte|infraestrutura|economia|emprego)/gi,
};

// Padrões de negação em português
const NEGATION_PATTERNS = [
  /\b(?:não|nunca|jamais|nenhum|nenhuma|nada|nem)\b/gi,
  /\b(?:sem|fora|exceto|salvo)\b/gi,
];

// Padrões de condição em português
const CONDITION_PATTERNS = {
  IF: /\b(?:se|caso|quando)\s+/gi,
  IF_ELECTED: /\b(?:se eleito|se eleita|caso eleito|caso eleita|quando eleito|quando eleita)\b/gi,
  IF_APPOINTED: /\b(?:se nomeado|se nomeada|se designado|se designada|quando nomeado|quando nomeada)\b/gi,
  UNLESS: /\b(?:a menos que|exceto se|salvo se)\b/gi,
};

// Padrões de escopo geográfico
const GEOGRAPHIC_PATTERNS = {
  NATIONAL: /\b(?:país|nação|brasil|nacional|federação|união)\b/gi,
  STATE: /\b(?:estado|estadual|SP|RJ|MG|BA|RS|PE|CE|PA|SC|GO|ES|MT|MS|DF|RO|AC|AM|AP|TO|RR|PI|MA|PB|RN|AL|SE)\b/gi,
  MUNICIPAL: /\b(?:município|municipal|cidade|prefeitura|câmara|vereador)\b/gi,
  REGIONAL: /\b(?:região|regional|nordeste|sudeste|sul|norte|centro-oeste)\b/gi,
};

export class AdvancedNLPAnalyzer {
  private tokenizer: natural.WordTokenizer;
  private classifier: natural.BayesClassifier;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.classifier = new natural.BayesClassifier();
    this.initializeClassifier();
  }

  /**
   * Analisar texto e extrair promessas
   */
  async analyzeText(text: string): Promise<PromiseAnalysis> {
    try {
      const normalizedText = this.normalizeText(text);
      
      // Análises paralelas
      const [promises, negations, conditions, entities, sentiment] = await Promise.all([
        this.extractPromises(normalizedText),
        this.analyzeNegations(normalizedText),
        this.analyzeConditions(normalizedText),
        this.extractEntities(normalizedText),
        this.analyzeSentiment(normalizedText),
      ]);

      const confidence = this.calculateConfidence(promises, negations, conditions);

      return {
        text,
        promises,
        negations,
        conditions,
        entities,
        sentiment,
        confidence,
      };
    } catch (error) {
      logger.error('Error in NLP analysis:', { error });
      throw error;
    }
  }

  /**
   * Extrair promessas do texto
   */
  private async extractPromises(text: string): Promise<ExtractedPromise[]> {
    const promises: ExtractedPromise[] = [];

    // Usar compromise para análise gramatical
    const doc = compromise(text);
    
    // Extrair verbos + objetos
    const verbs = (doc.verbs().out('array') as string[]) || [];
    const nouns = (doc.nouns().out('array') as string[]) || [];

    // Buscar padrões conhecidos
    for (const [category, pattern] of Object.entries(PROMISE_PATTERNS)) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const promiseText = match[0];
        const negated = this.isNegated(promiseText, text);
        const conditional = this.isConditional(promiseText, text);
        const scope = this.extractScope(promiseText);
        const action = this.extractAction(promiseText);
        const target = this.extractTarget(promiseText);

        promises.push({
          text: promiseText,
          category: category.toLowerCase(),
          confidence: 0.85,
          negated,
          conditional,
          scope,
          action,
          target,
        });
      }
    }

    // Análise de similaridade para evitar duplicatas
    return this.deduplicatePromises(promises);
  }

  /**
   * Analisar negações no texto
   */
  private analyzeNegations(text: string): NegationAnalysis {
    const negations: string[] = [];
    let hasNegation = false;

    for (const pattern of NEGATION_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        negations.push(match[0]);
        hasNegation = true;
      }
    }

    return {
      hasNegation,
      negations: [...new Set(negations)],
      confidence: hasNegation ? 0.9 : 1.0,
    };
  }

  /**
   * Analisar condições no texto
   */
  private analyzeConditions(text: string): ConditionAnalysis {
    let type: ConditionAnalysis['type'] = 'none';
    const conditions: string[] = [];
    let hasCondition = false;

    // Verificar padrões específicos de eleição
    if (CONDITION_PATTERNS.IF_ELECTED.test(text)) {
      type = 'if_elected';
      hasCondition = true;
      conditions.push('Se eleito/a');
    } else if (CONDITION_PATTERNS.IF_APPOINTED.test(text)) {
      type = 'if_appointed';
      hasCondition = true;
      conditions.push('Se nomeado/a');
    } else if (CONDITION_PATTERNS.IF.test(text)) {
      type = 'if';
      hasCondition = true;
      const matches = text.matchAll(CONDITION_PATTERNS.IF);
      for (const match of matches) {
        conditions.push(match[0]);
      }
    } else if (CONDITION_PATTERNS.UNLESS.test(text)) {
      type = 'unless';
      hasCondition = true;
      conditions.push('A menos que');
    }

    return {
      hasCondition,
      conditions,
      type,
      confidence: hasCondition ? 0.85 : 1.0,
    };
  }

  /**
   * Extrair entidades nomeadas
   */
  private extractEntities(text: string): EntityAnalysis {
    const doc = compromise(text);

    // Extrair diferentes tipos de entidades
    const locations = (doc.places().out('array') as string[]) || [];
    const organizations = (doc.organizations().out('array') as string[]) || [];
    const numbers = (doc.numbers().out('array') as string[]) || [];
    const dates: string[] = []; // Compromise não tem método dates()

    // Adicionar padrões customizados
    const stateMatches = text.matchAll(GEOGRAPHIC_PATTERNS.STATE);
    for (const match of stateMatches) {
      if (!locations.includes(match[0])) {
        locations.push(match[0]);
      }
    }

    return {
      locations: [...new Set(locations)],
      organizations: [...new Set(organizations)],
      numbers: [...new Set(numbers)],
      dates: [...new Set(dates)],
    };
  }

  /**
   * Analisar sentimento
   */
  private analyzeSentiment(text: string): SentimentAnalysis {
    const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
    const score = this.classifier.classify(text) as string;
    
    // Palavras positivas em português
    const positiveWords = ['ótimo', 'excelente', 'melhor', 'incrível', 'fantástico', 'maravilhoso', 'perfeito', 'sucesso', 'vitória', 'progresso'];
    // Palavras negativas em português
    const negativeWords = ['péssimo', 'horrível', 'pior', 'terrível', 'fracasso', 'derrota', 'problema', 'crise', 'desastre'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const token of tokens) {
      const tokenStr = String(token).toLowerCase();
      if (positiveWords.includes(tokenStr)) positiveCount++;
      if (negativeWords.includes(tokenStr)) negativeCount++;
    }

    const sentimentValue = positiveCount - negativeCount;
    const magnitude = Math.abs(sentimentValue) / Math.max(tokens.length, 1);
    const normalizedScore = Math.max(-1, Math.min(1, sentimentValue / Math.max(positiveCount + negativeCount, 1)));

    return {
      score: normalizedScore,
      magnitude,
      type: (normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
    };
  }

  /**
   * Verificar se promessa está negada
   */
  private isNegated(promiseText: string, fullText: string): boolean {
    // Verificar negações próximas (até 10 palavras antes)
    const words = fullText.split(/\s+/);
    const promiseWords = promiseText.split(/\s+/);
    const promiseIndex = fullText.indexOf(promiseText);

    if (promiseIndex === -1) return false;

    const beforeText = fullText.substring(Math.max(0, promiseIndex - 100), promiseIndex);
    return NEGATION_PATTERNS.some(pattern => pattern.test(beforeText));
  }

  /**
   * Verificar se promessa é condicional
   */
  private isConditional(promiseText: string, fullText: string): boolean {
    const promiseIndex = fullText.indexOf(promiseText);
    if (promiseIndex === -1) return false;

    const beforeText = fullText.substring(Math.max(0, promiseIndex - 200), promiseIndex);
    return Object.values(CONDITION_PATTERNS).some(pattern => pattern.test(beforeText));
  }

  /**
   * Extrair escopo geográfico
   */
  private extractScope(text: string): string {
    for (const [scope, pattern] of Object.entries(GEOGRAPHIC_PATTERNS)) {
      if (pattern.test(text)) {
        return scope.toLowerCase();
      }
    }
    return 'unknown';
  }

  /**
   * Extrair ação principal
   */
  private extractAction(text: string): string {
    const doc = compromise(text);
    const verbs = (doc.verbs().out('array') as string[]) || [];
    return (verbs[0] as string) || 'unknown';
  }

  /**
   * Extrair alvo da promessa
   */
  private extractTarget(text: string): string {
    const doc = compromise(text);
    const nouns = (doc.nouns().out('array') as string[]) || [];
    return (nouns[0] as string) || 'unknown';
  }

  /**
   * Remover duplicatas de promessas por similaridade
   */
  private deduplicatePromises(promises: ExtractedPromise[]): ExtractedPromise[] {
    const unique: ExtractedPromise[] = [];
    
    for (const promise of promises) {
      const isDuplicate = unique.some(p => 
        this.calculateSimilarity(p.text, promise.text) > 0.8
      );
      
      if (!isDuplicate) {
        unique.push(promise);
      }
    }
    
    return unique;
  }

  /**
   * Calcular similaridade entre dois textos (Levenshtein)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcular distância de Levenshtein
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];
    
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    
    return costs[s2.length];
  }

  /**
   * Calcular confiança geral da análise
   */
  private calculateConfidence(
    promises: ExtractedPromise[],
    negations: NegationAnalysis,
    conditions: ConditionAnalysis
  ): number {
    let confidence = 1.0;

    // Reduzir confiança se há negações
    if (negations.hasNegation) {
      confidence *= 0.8;
    }

    // Reduzir confiança se há condições
    if (conditions.hasCondition) {
      confidence *= 0.9;
    }

    // Aumentar confiança se há múltiplas promessas
    if (promises.length > 0) {
      confidence *= Math.min(1.0, 0.7 + (promises.length * 0.1));
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Normalizar texto
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  }

  /**
   * Inicializar classificador Bayes
   */
  private initializeClassifier(): void {
    // Treinar com exemplos de promessas
    (this.classifier as any).addDocument('vou construir escolas', 'promise');
    (this.classifier as any).addDocument('irei investir em saúde', 'promise');
    (this.classifier as any).addDocument('será melhorada a educação', 'promise');
    (this.classifier as any).addDocument('não vou aumentar impostos', 'promise');
    
    (this.classifier as any).addDocument('o tempo está bonito', 'not_promise');
    (this.classifier as any).addDocument('que dia é hoje', 'not_promise');
    (this.classifier as any).addDocument('como você está', 'not_promise');
    
    (this.classifier as any).train();
  }
}

// Exportar instância singleton
export const nlpAnalyzer = new AdvancedNLPAnalyzer();
