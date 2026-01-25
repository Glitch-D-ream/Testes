/**
 * Módulo de Análise de Coerência Legislativa
 * Detecta incoerências entre promessas (discurso) e ações legislativas (votos/vetos)
 * 
 * Fluxo:
 * 1. Extrai promessas do texto
 * 2. Busca votações recentes do político
 * 3. Analisa se há contradição entre promessa e voto
 * 4. Retorna um relatório de incoerências com evidências
 */

import { getDeputadoId, getVotacoesDeputado, analisarIncoerencia, Vote } from '../integrations/camara.ts';
import { logInfo, logError } from '../core/logger.ts';
import { ExtractedPromise } from './nlp.ts';

export interface IncoherenceReport {
  promiseId: string;
  promiseText: string;
  incoherences: IncoherenceCase[];
  coherenceScore: number; // 0-100, onde 100 é totalmente coerente
  lastAnalyzedVote?: Vote;
}

export interface IncoherenceCase {
  voteId: string;
  voteDate: string;
  voteType: string; // 'Sim', 'Não', 'Abstenção', 'Obstrução'
  propositionNumber: string;
  propositionEmenta: string;
  incoherenceType: 'DIRECT_CONTRADICTION' | 'THEMATIC_CONTRADICTION' | 'PARTIAL_CONTRADICTION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW'; // Baseado na importância do voto
  explanation: string;
  legislativeSourceUrl?: string;
}

/**
 * Mapeia temas de promessas para palavras-chave legislativas
 */
const THEME_KEYWORDS: Record<string, string[]> = {
  EDUCATION: ['educação', 'escola', 'ensino', 'universidade', 'professor', 'merenda', 'bolsa', 'aprendizado'],
  HEALTH: ['saúde', 'hospital', 'médico', 'sus', 'vacina', 'medicamento', 'clínica', 'enfermeiro'],
  SECURITY: ['segurança', 'polícia', 'crime', 'violência', 'armas', 'delegacia', 'presídio'],
  ECONOMY: ['economia', 'imposto', 'tributo', 'fiscal', 'orçamento', 'gasto', 'investimento', 'renda'],
  INFRASTRUCTURE: ['infraestrutura', 'obra', 'estrada', 'ponte', 'rodovia', 'ferrovia', 'aeroporto', 'porto'],
  ENVIRONMENT: ['ambiente', 'sustentabilidade', 'verde', 'parque', 'floresta', 'poluição', 'reciclagem'],
  SOCIAL: ['social', 'pobreza', 'assistência', 'benefício', 'auxílio', 'vulnerável', 'comunidade'],
  AGRICULTURE: ['agricultura', 'fazenda', 'agropecuária', 'plantação', 'subsídio', 'produtor']
};

/**
 * Palavras-chave que indicam apoio/suporte
 */
const SUPPORT_KEYWORDS = ['aumentar', 'investir', 'apoiar', 'criar', 'melhorar', 'expandir', 'fortalecer', 'ampliar'];

/**
 * Palavras-chave que indicam oposição/redução
 */
const OPPOSITION_KEYWORDS = ['reduzir', 'cortar', 'eliminar', 'diminuir', 'acabar', 'encerrar', 'revogar'];

/**
 * Analisa a coerência entre uma promessa e o histórico legislativo de um político
 */
export async function analyzeCoherence(
  promise: ExtractedPromise,
  politicianName: string,
  promiseId: string
): Promise<IncoherenceReport> {
  const report: IncoherenceReport = {
    promiseId,
    promiseText: promise.text,
    incoherences: [],
    coherenceScore: 100, // Começar com 100 e reduzir conforme incoerências são encontradas
  };

  try {
    // 1. Buscar ID do deputado
    logInfo(`[CoherenceAnalyzer] Buscando ID do deputado: ${politicianName}`);
    const deputadoId = await getDeputadoId(politicianName);
    
    if (!deputadoId) {
      logInfo(`[CoherenceAnalyzer] Deputado não encontrado: ${politicianName}`);
      return report; // Retornar relatório vazio se deputado não encontrado
    }

    // 2. Buscar votações recentes
    logInfo(`[CoherenceAnalyzer] Buscando votações do deputado ID: ${deputadoId}`);
    const votes = await getVotacoesDeputado(deputadoId);

    if (votes.length === 0) {
      logInfo(`[CoherenceAnalyzer] Nenhuma votação encontrada para: ${politicianName}`);
      return report;
    }

    // 3. Determinar tema da promessa
    const promiseTheme = determineTheme(promise.text);
    logInfo(`[CoherenceAnalyzer] Tema da promessa: ${promiseTheme}`);

    // 4. Analisar cada votação em relação à promessa
    for (const vote of votes) {
      const incoherence = analyzeVoteAgainstPromise(promise, vote, promiseTheme);
      
      if (incoherence) {
        report.incoherences.push(incoherence);
        report.lastAnalyzedVote = vote;
        
        // Reduzir score de coerência baseado na severidade
        const severityPenalty = incoherence.severity === 'HIGH' ? 30 : incoherence.severity === 'MEDIUM' ? 15 : 5;
        report.coherenceScore = Math.max(0, report.coherenceScore - severityPenalty);
      }
    }

    logInfo(`[CoherenceAnalyzer] Análise concluída. Score de coerência: ${report.coherenceScore}%`);
  } catch (error) {
    logError('[CoherenceAnalyzer] Erro ao analisar coerência', error as Error);
  }

  return report;
}

/**
 * Determina o tema principal de uma promessa
 */
function determineTheme(promiseText: string): string {
  const textLower = promiseText.toLowerCase();

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return theme;
    }
  }

  return 'GENERAL';
}

/**
 * Analisa se um voto específico contradiz uma promessa
 */
function analyzeVoteAgainstPromise(
  promise: ExtractedPromise,
  vote: Vote,
  promiseTheme: string
): IncoherenceCase | null {
  const promiseTextLower = promise.text.toLowerCase();
  const voteEmentaLower = vote.ementa.toLowerCase();
  const themeKeywords = THEME_KEYWORDS[promiseTheme] || [];

  // Verificar se o voto é sobre o mesmo tema
  const voteIsAboutTheme = themeKeywords.some(kw => voteEmentaLower.includes(kw));
  
  if (!voteIsAboutTheme) {
    return null; // Voto não é sobre o mesmo tema
  }

  // Determinar intenção da promessa (apoio ou oposição)
  const promiseSupports = SUPPORT_KEYWORDS.some(kw => promiseTextLower.includes(kw));
  const promiseOpposes = OPPOSITION_KEYWORDS.some(kw => promiseTextLower.includes(kw));

  // Determinar tipo de voto
  const voteIsAgainst = vote.voto === 'Não' || vote.voto === 'Obstrução' || vote.voto.toLowerCase().includes('contra');
  const voteIsFor = vote.voto === 'Sim' || vote.voto.toLowerCase().includes('favor');

  // Detectar contradição
  let incoherenceType: IncoherenceCase['incoherenceType'] | null = null;
  let severity: IncoherenceCase['severity'] = 'LOW';
  let explanation = '';

  if (promiseSupports && voteIsAgainst) {
    incoherenceType = 'DIRECT_CONTRADICTION';
    severity = 'HIGH';
    explanation = `O político prometeu apoiar a área de ${promiseTheme}, mas votou "${vote.voto}" na proposição ${vote.proposicao} que trata de: "${vote.ementa}".`;
  } else if (promiseOpposes && voteIsFor) {
    incoherenceType = 'DIRECT_CONTRADICTION';
    severity = 'HIGH';
    explanation = `O político prometeu se opor a medidas na área de ${promiseTheme}, mas votou "${vote.voto}" na proposição ${vote.proposicao} que trata de: "${vote.ementa}".`;
  } else if (promiseSupports && voteIsFor && isPartiallyRelated(promiseTextLower, voteEmentaLower)) {
    // Voto coerente, sem incoerência
    return null;
  } else if (promiseOpposes && voteIsAgainst && isPartiallyRelated(promiseTextLower, voteEmentaLower)) {
    // Voto coerente, sem incoerência
    return null;
  }

  if (!incoherenceType) {
    return null; // Sem incoerência detectada
  }

  return {
    voteId: vote.idVotacao,
    voteDate: vote.data,
    voteType: vote.voto,
    propositionNumber: vote.proposicao,
    propositionEmenta: vote.ementa,
    incoherenceType,
    severity,
    explanation,
    legislativeSourceUrl: `https://www2.camara.leg.br/a-camara/conheca/historia/cronologia/2024/votacoes/${vote.idVotacao}`
  };
}

/**
 * Verifica se dois textos estão parcialmente relacionados (para evitar falsos positivos)
 */
function isPartiallyRelated(text1: string, text2: string): boolean {
  const words1 = text1.split(/\s+/).filter(w => w.length > 4);
  const words2 = text2.split(/\s+/).filter(w => w.length > 4);
  
  const commonWords = words1.filter(w => words2.includes(w));
  return commonWords.length > 0;
}

/**
 * Gera um resumo textual do relatório de coerência
 */
export function generateCoherenceSummary(report: IncoherenceReport): string {
  if (report.incoherences.length === 0) {
    return `Nenhuma incoerência legislativa detectada para esta promessa. O histórico de votações do político está alinhado com o compromisso declarado.`;
  }

  const highSeverity = report.incoherences.filter(i => i.severity === 'HIGH').length;
  const mediumSeverity = report.incoherences.filter(i => i.severity === 'MEDIUM').length;

  let summary = `Foram detectadas ${report.incoherences.length} incoerência(s) legislativa(s)`;
  
  if (highSeverity > 0) {
    summary += ` (${highSeverity} de alta severidade)`;
  }
  
  summary += `. O score de coerência é de ${report.coherenceScore}%, indicando `;
  
  if (report.coherenceScore >= 80) {
    summary += `boa consistência entre promessas e ações legislativas.`;
  } else if (report.coherenceScore >= 50) {
    summary += `coerência parcial, com algumas contradições notáveis.`;
  } else {
    summary += `sérias contradições entre o discurso e as ações legislativas.`;
  }

  return summary;
}
