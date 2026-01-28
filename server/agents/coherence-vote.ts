/**
 * Coherence Vote Agent v1.0
 * 
 * Cruza promessas extraídas com votações na Câmara dos Deputados
 * Identifica contradições entre discurso e prática legislativa
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { getDeputadoId, getVotacoesDeputado, Vote } from '../integrations/camara.ts';

export interface PromiseInput {
  text: string;
  category: string;
  source: string;
  date?: string;
  quote?: string;
}

export interface VoteCoherenceResult {
  promise: PromiseInput;
  relatedVotes: VoteAnalysis[];
  coherenceScore: number;  // 0-100
  verdict: 'COERENTE' | 'PARCIALMENTE_COERENTE' | 'INCOERENTE' | 'SEM_DADOS';
  summary: string;
}

export interface VoteAnalysis {
  vote: Vote;
  relation: 'APOIA' | 'CONTRADIZ' | 'NEUTRO';
  explanation: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class CoherenceVoteAgent {
  /**
   * Analisa a coerência entre promessas e votações
   */
  async analyze(
    politicianName: string,
    promises: PromiseInput[]
  ): Promise<VoteCoherenceResult[]> {
    logInfo(`[CoherenceVote] Analisando coerência de ${promises.length} promessas para: ${politicianName}`);

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
          verdict: 'SEM_DADOS' as const,
          summary: 'Não foi possível encontrar o político na base da Câmara dos Deputados.'
        }));
      }

      // 2. Buscar votações do deputado
      const votes = await getVotacoesDeputado(deputadoId);
      logInfo(`[CoherenceVote] ${votes.length} votações encontradas para análise`);

      if (votes.length === 0) {
        return promises.map(p => ({
          promise: p,
          relatedVotes: [],
          coherenceScore: 50,
          verdict: 'SEM_DADOS' as const,
          summary: 'Nenhuma votação recente encontrada para análise.'
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
   * Analisa uma promessa específica contra as votações
   */
  private async analyzePromiseVsVotes(
    promise: PromiseInput,
    votes: Vote[],
    politicianName: string
  ): Promise<VoteCoherenceResult> {
    logInfo(`[CoherenceVote] Analisando promessa: ${promise.text.substring(0, 50)}...`);

    try {
      // Usar IA para identificar votações relacionadas e analisar coerência
      const prompt = `
VOCÊ É UM ANALISTA DE COERÊNCIA POLÍTICA DO SETH VII.

POLÍTICO: ${politicianName}

PROMESSA ANALISADA:
- Texto: "${promise.text}"
- Categoria: ${promise.category}
- Fonte: ${promise.source}
- Data: ${promise.date || 'N/A'}
${promise.quote ? `- Citação direta: "${promise.quote}"` : ''}

VOTAÇÕES DO POLÍTICO (últimas 20):
${votes.map((v, i) => `
${i+1}. [${v.data?.split('T')[0] || 'N/A'}] ${v.proposicao}
   Voto: ${v.voto}
   Ementa: ${v.ementa}
   Orientação do partido: ${v.orientacao || 'N/A'}
   Votou contra o partido: ${v.rebeldia ? 'SIM' : 'NÃO'}
`).join('')}

INSTRUÇÕES:
1. Identifique votações que têm RELAÇÃO TEMÁTICA com a promessa
2. Para cada votação relacionada, analise se o voto APOIA ou CONTRADIZ a promessa
3. Considere que votar "Sim" em algo que vai CONTRA a promessa é uma contradição
4. Considere que votar "Não" em algo que APOIA a promessa é uma contradição
5. Atribua um score de coerência (0-100)

RESPONDA APENAS JSON:
{
  "relatedVotes": [
    {
      "voteIndex": 1,
      "relation": "APOIA|CONTRADIZ|NEUTRO",
      "explanation": "explicação da relação",
      "severity": "HIGH|MEDIUM|LOW"
    }
  ],
  "coherenceScore": 0-100,
  "verdict": "COERENTE|PARCIALMENTE_COERENTE|INCOERENTE|SEM_DADOS",
  "summary": "resumo da análise em 2-3 frases"
}

SE NÃO HOUVER VOTAÇÕES RELACIONADAS, RETORNE:
{
  "relatedVotes": [],
  "coherenceScore": 50,
  "verdict": "SEM_DADOS",
  "summary": "Não foram encontradas votações relacionadas a esta promessa."
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[CoherenceVote] Resposta da IA não contém JSON válido`);
        return this.createEmptyResult(promise);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Mapear os índices de volta para os votos reais
      const relatedVotes: VoteAnalysis[] = (parsed.relatedVotes || [])
        .filter((rv: any) => rv.voteIndex && rv.voteIndex <= votes.length)
        .map((rv: any) => ({
          vote: votes[rv.voteIndex - 1],
          relation: rv.relation || 'NEUTRO',
          explanation: rv.explanation || '',
          severity: rv.severity || 'LOW'
        }));

      return {
        promise,
        relatedVotes,
        coherenceScore: parsed.coherenceScore || 50,
        verdict: parsed.verdict || 'SEM_DADOS',
        summary: parsed.summary || 'Análise não disponível.'
      };

    } catch (error: any) {
      logError(`[CoherenceVote] Erro ao analisar promessa: ${error.message}`);
      return this.createEmptyResult(promise);
    }
  }

  /**
   * Cria resultado vazio para casos de erro
   */
  private createEmptyResult(promise: PromiseInput): VoteCoherenceResult {
    return {
      promise,
      relatedVotes: [],
      coherenceScore: 50,
      verdict: 'SEM_DADOS',
      summary: 'Não foi possível realizar a análise de coerência.'
    };
  }

  /**
   * Gera um relatório consolidado de todas as análises
   */
  generateReport(results: VoteCoherenceResult[]): string {
    if (results.length === 0) {
      return 'Nenhuma promessa analisada.';
    }

    const coherent = results.filter(r => r.verdict === 'COERENTE').length;
    const partial = results.filter(r => r.verdict === 'PARCIALMENTE_COERENTE').length;
    const incoherent = results.filter(r => r.verdict === 'INCOERENTE').length;
    const noData = results.filter(r => r.verdict === 'SEM_DADOS').length;

    const avgScore = Math.round(
      results.reduce((sum, r) => sum + r.coherenceScore, 0) / results.length
    );

    let report = `
## ANÁLISE DE COERÊNCIA: PROMESSAS vs VOTAÇÕES

**Score Médio de Coerência:** ${avgScore}%

**Resumo:**
- ✅ Coerentes: ${coherent}
- ⚠️ Parcialmente coerentes: ${partial}
- ❌ Incoerentes: ${incoherent}
- ❓ Sem dados: ${noData}

### Detalhamento:
`;

    for (const result of results) {
      const icon = result.verdict === 'COERENTE' ? '✅' : 
                   result.verdict === 'INCOERENTE' ? '❌' : 
                   result.verdict === 'PARCIALMENTE_COERENTE' ? '⚠️' : '❓';

      report += `
#### ${icon} ${result.promise.text.substring(0, 60)}...
- **Categoria:** ${result.promise.category}
- **Score:** ${result.coherenceScore}%
- **Veredito:** ${result.verdict}
- **Análise:** ${result.summary}
`;

      if (result.relatedVotes.length > 0) {
        report += `- **Votações relacionadas:**\n`;
        for (const va of result.relatedVotes) {
          const voteIcon = va.relation === 'APOIA' ? '👍' : va.relation === 'CONTRADIZ' ? '👎' : '➖';
          report += `  - ${voteIcon} ${va.vote.proposicao} (${va.vote.voto}): ${va.explanation}\n`;
        }
      }
    }

    return report;
  }
}

export const coherenceVoteAgent = new CoherenceVoteAgent();
