/**
 * Motor de PLN para extração de promessas em português
 * Utiliza expressões regulares e padrões linguísticos
 */

export interface ExtractedPromise {
  text: string;
  confidence: number;
  category: string;
  entities: {
    verbs: string[];
    nouns: string[];
    numbers: string[];
  };
  negated?: boolean;
  conditional?: boolean;
  reasoning?: string;
}

// Padrões de verbos que indicam promessas
const PROMISE_VERBS = [
  'vou', 'vamos', 'iremos', 'irei',
  'prometo', 'prometemos', 'prometerem',
  'farei', 'faremos', 'farão',
  'construirei', 'construiremos', 'construirão',
  'implementarei', 'implementaremos', 'implementarão',
  'criarei', 'criaremos', 'criarão',
  'aumentarei', 'aumentaremos', 'aumentarão',
  'reduzirei', 'reduziremos', 'reduzirão',
  'melhorarei', 'melhoraremos', 'melhorarão',
  'investirei', 'investiremos', 'investirão',
  'garantirei', 'garantiremos', 'garantirão',
  'assegurarei', 'asseguraremos', 'assegurarão',
  'realizarei', 'realizaremos', 'realizarão',
  'executarei', 'executaremos', 'executarão',
  'entreguei', 'entregamos', 'entregarei', 'entregaremos',
  'desenvolvi', 'desenvolvemos', 'desenvolverei', 'desenvolveremos',
  'ampliarei', 'ampliaremos', 'ampliarão',
  'expandirei', 'expandiremos', 'expandirão',
  'modernizarei', 'modernizaremos', 'modernizarão',
  'reformarei', 'reformaremos', 'reformarão',
  'restaurarei', 'restauraremos', 'restaurarão',
  'recuperarei', 'recuperaremos', 'recuperarão',
  'revitalizarei', 'revitalizaremos', 'revitalizarão'
];

// Categorias de promessas
const PROMISE_CATEGORIES = {
  INFRASTRUCTURE: ['construir', 'obra', 'estrada', 'ponte', 'rodovia', 'ferrovia', 'aeroporto', 'porto', 'infraestrutura'],
  EDUCATION: ['escola', 'educação', 'ensino', 'universidade', 'bolsa', 'professor', 'aluno', 'aprendizado'],
  HEALTH: ['saúde', 'hospital', 'médico', 'medicamento', 'ambulância', 'clínica', 'enfermeiro', 'atendimento'],
  EMPLOYMENT: ['emprego', 'trabalho', 'desemprego', 'renda', 'salário', 'profissão', 'ocupação', 'contratação'],
  SECURITY: ['segurança', 'polícia', 'crime', 'violência', 'patrulha', 'delegacia', 'presídio', 'criminalidade'],
  ENVIRONMENT: ['ambiente', 'sustentabilidade', 'verde', 'parque', 'floresta', 'poluição', 'reciclagem', 'energia'],
  SOCIAL: ['social', 'pobreza', 'assistência', 'benefício', 'auxílio', 'vulnerável', 'comunidade', 'inclusão'],
  ECONOMY: ['economia', 'negócio', 'empresa', 'investimento', 'crescimento', 'PIB', 'renda', 'desenvolvimento'],
  AGRICULTURE: ['agricultura', 'fazenda', 'agropecuária', 'plantação', 'colheita', 'subsídio', 'produtor'],
  CULTURE: ['cultura', 'arte', 'música', 'cinema', 'museu', 'patrimônio', 'evento', 'festival']
};

export function extractPromises(text: string): ExtractedPromise[] {
  const promises: ExtractedPromise[] = [];
  const sentences = splitSentences(text);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    
    // Verificar se contém verbo de promessa
    for (const verb of PROMISE_VERBS) {
      if (sentenceLower.includes(verb)) {
        const promise = analyzeSentence(sentence, verb);
        if (promise) {
          promises.push(promise);
        }
        break;
      }
    }
  }

  return promises;
}

function splitSentences(text: string): string[] {
  // Dividir por pontuação comum
  return text
    .split(/[.!?;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function analyzeSentence(sentence: string, verb: string): ExtractedPromise | null {
  const sentenceLower = sentence.toLowerCase();
  
  // Extrair entidades
  const numbers = extractNumbers(sentence);
  const nouns = extractNouns(sentence);
  
  // Determinar categoria
  let category = 'GERAL';
  for (const [cat, keywords] of Object.entries(PROMISE_CATEGORIES)) {
    if (keywords.some(kw => sentenceLower.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Calcular confiança baseado em características
  let confidence = 0.5;
  
  // Aumentar confiança se há números (metas específicas)
  if (numbers.length > 0) confidence += 0.2;
  
  // Aumentar confiança se há data/prazo
  if (/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i.test(sentence)) {
    confidence += 0.1;
  }
  
  // Aumentar confiança se há quantidade específica
  if (/\b(mil|milhão|bilhão|centenas|dezenas|todas|todos|100%)\b/i.test(sentence)) {
    confidence += 0.1;
  }

  // Limitar confiança a 1.0
  confidence = Math.min(confidence, 1.0);

  return {
    text: sentence.trim(),
    confidence,
    category,
    entities: {
      verbs: [verb],
      nouns,
      numbers
    },
    negated: false,
    conditional: false
  };
}

function extractNumbers(text: string): string[] {
  const numberPattern = /\b\d+(?:[.,]\d+)?\s*(?:mil|milhão|bilhão|%|reais|R\$)?\b/gi;
  const matches = text.match(numberPattern);
  return matches || [];
}

function extractNouns(sentence: string): string[] {
  // Padrão simplificado para extrair substantivos em português
  // Palavras capitalizadas ou após preposições
  const nounPattern = /\b([A-Z][a-záéíóúâêôãõç]*|(?:de|em|para|por|com)\s+([a-záéíóúâêôãõç]+))\b/g;
  const matches: string[] = [];
  let match;

  while ((match = nounPattern.exec(sentence)) !== null) {
    matches.push(match[1] || match[2]);
  }

  return [...new Set(matches)]; // Remover duplicatas
}

/**
 * Função auxiliar para análise de confiabilidade de promessa
 * Retorna um score de 0 a 1 indicando quão específica e verificável é a promessa
 */
export function analyzePromiseReliability(promise: ExtractedPromise): number {
  let score = promise.confidence;

  // Promessas com números específicos são mais verificáveis
  if (promise.entities.numbers.length > 0) {
    score += 0.15;
  }

  // Promessas com prazos definidos são mais verificáveis
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i)) {
    score += 0.1;
  }

  // Reduzir confiança para promessas muito genéricas
  if (promise.text.length < 20) {
    score -= 0.1;
  }

  return Math.min(Math.max(score, 0), 1);
}
