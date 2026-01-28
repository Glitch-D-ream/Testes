/**
 * Coherence Vote Agent v2.0 - INCISIVO
 * 
 * Cruza promessas com votações do político
 * COM ANÁLISE PROFUNDA: impacto, interesses, lobbies, doadores
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { getDeputadoId, getVotacoesDeputado } from '../integrations/camara.ts';

export interface PromiseInput {
  text: string;
  category: string;
  source: string;
  date?: string;
  quote?: string;
}

export interface Vote {
  proposicao: string;
  ementa: string;
  data?: string;
  voto: string;
  orientacao?: string;
  rebeldia?: boolean;
}

export interface RelatedVote {
  vote: Vote;
  relation: 'APOIA' | 'CONTRADIZ' | 'NEUTRO';
  explanation: string;
  impactAnalysis: string;
  beneficiaries: string[];
  potentialLobby?: string;
}

export interface VoteCoherenceResult {
  promise: PromiseInput;
  relatedVotes: RelatedVote[];
  coherenceScore: number;
  verdict: 'COERENTE' | 'PARCIALMENTE_COERENTE' | 'INCOERENTE';
  summary: string;
  deepAnalysis: {
    votingPattern: string;
    possibleInterests: string[];
    impactOnCitizens: string;
    followTheMoneyAlerts: string[];
  };
}

export class CoherenceVoteAgent {
  /**
   * Analisa coerência entre promessas e votações
   */
  async analyze(politicianName: string, promises: PromiseInput[]): Promise<VoteCoherenceResult[]> {
    logInfo(`[CoherenceVote] Iniciando análise para: ${politicianName}`);
    logInfo(`[CoherenceVote] Promessas a analisar: ${promises.length}`);

    const results: VoteCoherenceResult[] = [];

    try {
      // 1. Buscar ID do deputado
      const deputadoId = await getDeputadoId(politicianName);
      if (!deputadoId) {
        logWarn(`[CoherenceVote] Deputado não encontrado: ${politicianName}`);
        return promises.map(p => ({
          promise: p,
          relatedVotes: [],
          coherenceScore: 50,
          verdict: 'PARCIALMENTE_COERENTE' as const,
          summary: 'Não foi possível encontrar o político no sistema da Câmara.',
          deepAnalysis: {
            votingPattern: 'N/A',
            possibleInterests: [],
            impactOnCitizens: 'N/A',
            followTheMoneyAlerts: []
          }
        }));
      }

      // 2. Buscar votações
      const votes = await getVotacoesDeputado(deputadoId, 50);
      logInfo(`[CoherenceVote] ${votes.length} votações encontradas`);

      if (votes.length === 0) {
        return promises.map(p => ({
          promise: p,
          relatedVotes: [],
          coherenceScore: 50,
          verdict: 'PARCIALMENTE_COERENTE' as const,
          summary: 'Nenhuma votação recente encontrada para análise.',
          deepAnalysis: {
            votingPattern: 'Sem dados suficientes',
            possibleInterests: [],
            impactOnCitizens: 'Não foi possível avaliar',
            followTheMoneyAlerts: []
          }
        }));
      }

      // 3. Para cada promessa, analisar votações relacionadas
      for (const promise of promises) {
        const result = await this.analyzePromiseVsVotes(promise, votes, politicianName);
        results.push(result);
      }

    } catch (error: any) {
      logError(`[CoherenceVote] Erro na análise: ${error.message}`);
    }

    return results;
  }

  /**
   * Analisa uma promessa específica contra as votações - VERSÃO INCISIVA
   */
  private async analyzePromiseVsVotes(
    promise: PromiseInput,
    votes: Vote[],
    politicianName: string
  ): Promise<VoteCoherenceResult> {
    logInfo(`[CoherenceVote] Analisando promessa: ${promise.text.substring(0, 50)}...`);

    try {
      const prompt = `
═══════════════════════════════════════════════════════════════════════════════
ANÁLISE FORENSE DE COERÊNCIA POLÍTICA - SETH VII v2.0
═══════════════════════════════════════════════════════════════════════════════

VOCÊ É UM INVESTIGADOR POLÍTICO ESPECIALIZADO EM ANÁLISE DE VOTAÇÕES.
SUA MISSÃO: Identificar CONTRADIÇÕES entre o que o político PROMETE e como ele VOTA.

═══════════════════════════════════════════════════════════════════════════════
POLÍTICO ALVO: ${politicianName}
═══════════════════════════════════════════════════════════════════════════════

PROMESSA ANALISADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Texto: "${promise.text}"
Categoria: ${promise.category}
Fonte: ${promise.source}
Data: ${promise.date || 'N/A'}
${promise.quote ? `Citação direta: "${promise.quote}"` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO DE VOTAÇÕES (últimas ${votes.length}):
${votes.map((v, i) => `
[${i+1}] ${v.data?.split('T')[0] || 'N/A'} | ${v.proposicao}
    Voto: ${v.voto}
    Ementa: ${v.ementa}
    Orientação do partido: ${v.orientacao || 'N/A'}
    Votou contra o partido: ${v.rebeldia ? '⚠️ SIM (REBELDIA)' : 'NÃO'}
`).join('')}

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES DE ANÁLISE FORENSE:
═══════════════════════════════════════════════════════════════════════════════

1. IDENTIFICAÇÃO DE VOTAÇÕES RELACIONADAS:
   - Encontre TODAS as votações que têm relação temática com a promessa
   - Considere relações diretas E indiretas
   - Não ignore votações que pareçam "técnicas" - muitas vezes escondem interesses

2. ANÁLISE DE COERÊNCIA:
   - Votar SIM em algo que CONTRADIZ a promessa = INCOERÊNCIA
   - Votar NÃO em algo que APOIA a promessa = INCOERÊNCIA
   - Votar contra a orientação do partido em tema da promessa = ALERTA

3. ANÁLISE DE IMPACTO (para cada voto):
   - QUEM se beneficia com esse voto?
   - QUEM é prejudicado?
   - Há INTERESSES ECONÔMICOS por trás?
   - Há LOBBIES conhecidos nesse tema?

4. FOLLOW THE MONEY:
   - Esse voto beneficia setores que financiam campanhas?
   - Há padrão de votos favoráveis a determinados setores?
   - O político vota consistentemente a favor de quem?

5. IMPACTO NO CIDADÃO:
   - Como esse voto afeta a vida do cidadão comum?
   - O voto está alinhado com o interesse público?

═══════════════════════════════════════════════════════════════════════════════
RESPONDA APENAS JSON (seja INCISIVO e NÃO TENHA MEDO de apontar contradições):
═══════════════════════════════════════════════════════════════════════════════

{
  "relatedVotes": [
    {
      "proposicao": "nome da proposição",
      "voto": "SIM/NÃO/ABSTENÇÃO",
      "data": "data do voto",
      "relation": "APOIA|CONTRADIZ|NEUTRO",
      "explanation": "explicação detalhada de como esse voto se relaciona com a promessa",
      "impactAnalysis": "análise do impacto real desse voto para a população",
      "beneficiaries": ["quem se beneficia com esse voto"],
      "potentialLobby": "possível lobby ou interesse econômico por trás"
    }
  ],
  "coherenceScore": 0-100,
  "verdict": "COERENTE|PARCIALMENTE_COERENTE|INCOERENTE",
  "summary": "resumo INCISIVO da análise em 2-3 frases",
  "deepAnalysis": {
    "votingPattern": "padrão identificado nas votações do político",
    "possibleInterests": ["interesses que parecem guiar os votos"],
    "impactOnCitizens": "como os votos afetam o cidadão comum",
    "followTheMoneyAlerts": ["alertas sobre possíveis conexões financeiras"]
  }
}

SE NÃO HOUVER VOTAÇÕES RELACIONADAS:
{
  "relatedVotes": [],
  "coherenceScore": 50,
  "verdict": "PARCIALMENTE_COERENTE",
  "summary": "Não foram encontradas votações diretamente relacionadas a esta promessa no período analisado.",
  "deepAnalysis": {
    "votingPattern": "Insuficiente para análise",
    "possibleInterests": [],
    "impactOnCitizens": "Não foi possível avaliar",
    "followTheMoneyAlerts": []
  }
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        promise,
        relatedVotes: (parsed.relatedVotes || []).map((rv: any) => ({
          vote: {
            proposicao: rv.proposicao,
            ementa: rv.ementa || '',
            data: rv.data,
            voto: rv.voto
          },
          relation: rv.relation || 'NEUTRO',
          explanation: rv.explanation || '',
          impactAnalysis: rv.impactAnalysis || '',
          beneficiaries: rv.beneficiaries || [],
          potentialLobby: rv.potentialLobby
        })),
        coherenceScore: parsed.coherenceScore || 50,
        verdict: parsed.verdict || 'PARCIALMENTE_COERENTE',
        summary: parsed.summary || 'Análise inconclusiva.',
        deepAnalysis: parsed.deepAnalysis || {
          votingPattern: 'N/A',
          possibleInterests: [],
          impactOnCitizens: 'N/A',
          followTheMoneyAlerts: []
        }
      };

    } catch (error: any) {
      logError(`[CoherenceVote] Erro ao analisar promessa: ${error.message}`);
      return {
        promise,
        relatedVotes: [],
        coherenceScore: 50,
        verdict: 'PARCIALMENTE_COERENTE',
        summary: `Erro na análise: ${error.message}`,
        deepAnalysis: {
          votingPattern: 'Erro na análise',
          possibleInterests: [],
          impactOnCitizens: 'Não foi possível avaliar',
          followTheMoneyAlerts: []
        }
      };
    }
  }
}

export const coherenceVoteAgent = new CoherenceVoteAgent();
