/**
 * Coherence Temporal Agent v1.0
 * 
 * Detecta contradições temporais nas declarações do político
 * Identifica mudanças de posição ao longo do tempo
 */

import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';

export interface Statement {
  text: string;
  date: string;
  source: string;
  category?: string;
  quote?: string;
}

export interface TemporalContradiction {
  statement1: Statement;
  statement2: Statement;
  type: 'FLIP_FLOP' | 'CONTRADIÇÃO_DIRETA' | 'MUDANÇA_GRADUAL' | 'OMISSÃO';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  timeDifference: string;
}

export interface TemporalAnalysisResult {
  contradictions: TemporalContradiction[];
  consistencyScore: number;  // 0-100
  summary: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  date: string;
  statement: string;
  source: string;
  position: 'A_FAVOR' | 'CONTRA' | 'NEUTRO';
  topic: string;
}

export class CoherenceTemporalAgent {
  /**
   * Analisa contradições temporais em um conjunto de declarações
   */
  async analyze(
    politicianName: string,
    statements: Statement[]
  ): Promise<TemporalAnalysisResult> {
    logInfo(`[CoherenceTemporal] Analisando ${statements.length} declarações de: ${politicianName}`);

    if (statements.length < 2) {
      return {
        contradictions: [],
        consistencyScore: 100,
        summary: 'Não há declarações suficientes para análise temporal.',
        timeline: []
      };
    }

    try {
      // Ordenar declarações por data
      const sortedStatements = [...statements].sort((a, b) => {
        const dateA = new Date(a.date || '2020-01-01');
        const dateB = new Date(b.date || '2020-01-01');
        return dateA.getTime() - dateB.getTime();
      });

      // Usar IA para identificar contradições
      const prompt = `
VOCÊ É UM ANALISTA DE CONSISTÊNCIA TEMPORAL DO SETH VII.

POLÍTICO: ${politicianName}

DECLARAÇÕES EM ORDEM CRONOLÓGICA:
${sortedStatements.map((s, i) => `
${i+1}. [${s.date || 'Data desconhecida'}] 
   Fonte: ${s.source}
   Categoria: ${s.category || 'GERAL'}
   Declaração: "${s.text}"
   ${s.quote ? `Citação: "${s.quote}"` : ''}
`).join('\n')}

INSTRUÇÕES:
1. Identifique CONTRADIÇÕES entre declarações feitas em momentos diferentes
2. Tipos de contradição:
   - FLIP_FLOP: Mudou de posição completamente (era contra, agora é a favor)
   - CONTRADIÇÃO_DIRETA: Disse coisas opostas sobre o mesmo tema
   - MUDANÇA_GRADUAL: Posição foi mudando aos poucos
   - OMISSÃO: Prometeu algo e depois nunca mais mencionou
3. Avalie a severidade (HIGH = mudança radical, MEDIUM = ajuste significativo, LOW = nuance)
4. Crie uma timeline mostrando a evolução das posições

RESPONDA APENAS JSON:
{
  "contradictions": [
    {
      "statement1Index": 1,
      "statement2Index": 3,
      "type": "FLIP_FLOP|CONTRADIÇÃO_DIRETA|MUDANÇA_GRADUAL|OMISSÃO",
      "severity": "HIGH|MEDIUM|LOW",
      "explanation": "explicação da contradição",
      "topic": "tema da contradição"
    }
  ],
  "timeline": [
    {
      "date": "2023-01-15",
      "statement": "resumo da declaração",
      "source": "fonte",
      "position": "A_FAVOR|CONTRA|NEUTRO",
      "topic": "tema"
    }
  ],
  "consistencyScore": 0-100,
  "summary": "resumo geral da consistência do político em 2-3 frases"
}

SE NÃO HOUVER CONTRADIÇÕES, RETORNE consistencyScore: 100 e contradictions: []`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[CoherenceTemporal] Resposta da IA não contém JSON válido`);
        return this.createEmptyResult();
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Mapear índices para declarações reais
      const contradictions: TemporalContradiction[] = (parsed.contradictions || [])
        .filter((c: any) => 
          c.statement1Index && c.statement2Index && 
          c.statement1Index <= sortedStatements.length && 
          c.statement2Index <= sortedStatements.length
        )
        .map((c: any) => {
          const s1 = sortedStatements[c.statement1Index - 1];
          const s2 = sortedStatements[c.statement2Index - 1];
          
          // Calcular diferença de tempo
          const date1 = new Date(s1.date || '2020-01-01');
          const date2 = new Date(s2.date || '2020-01-01');
          const diffDays = Math.abs(Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)));
          const timeDifference = diffDays > 365 
            ? `${Math.round(diffDays / 365)} ano(s)` 
            : diffDays > 30 
              ? `${Math.round(diffDays / 30)} mês(es)` 
              : `${diffDays} dia(s)`;

          return {
            statement1: s1,
            statement2: s2,
            type: c.type || 'CONTRADIÇÃO_DIRETA',
            severity: c.severity || 'MEDIUM',
            explanation: c.explanation || '',
            timeDifference
          };
        });

      return {
        contradictions,
        consistencyScore: parsed.consistencyScore || 50,
        summary: parsed.summary || 'Análise temporal concluída.',
        timeline: parsed.timeline || []
      };

    } catch (error: any) {
      logError(`[CoherenceTemporal] Erro na análise: ${error.message}`);
      return this.createEmptyResult();
    }
  }

  /**
   * Cria resultado vazio
   */
  private createEmptyResult(): TemporalAnalysisResult {
    return {
      contradictions: [],
      consistencyScore: 50,
      summary: 'Não foi possível realizar a análise temporal.',
      timeline: []
    };
  }

  /**
   * Gera relatório de contradições temporais
   */
  generateReport(result: TemporalAnalysisResult): string {
    let report = `
## ANÁLISE DE CONSISTÊNCIA TEMPORAL

**Score de Consistência:** ${result.consistencyScore}%
**Resumo:** ${result.summary}

### Contradições Identificadas
`;

    if (result.contradictions.length === 0) {
      report += '\n✅ Nenhuma contradição temporal identificada.\n';
    } else {
      for (const c of result.contradictions) {
        const icon = c.severity === 'HIGH' ? '🔴' : c.severity === 'MEDIUM' ? '🟡' : '🟢';
        
        report += `
#### ${icon} ${c.type} (Severidade: ${c.severity})
**Diferença temporal:** ${c.timeDifference}

**Declaração 1** (${c.statement1.date || 'N/A'}):
> "${c.statement1.text}"
> Fonte: ${c.statement1.source}

**Declaração 2** (${c.statement2.date || 'N/A'}):
> "${c.statement2.text}"
> Fonte: ${c.statement2.source}

**Análise:** ${c.explanation}
`;
      }
    }

    if (result.timeline.length > 0) {
      report += `
### Timeline de Posições
`;
      for (const event of result.timeline) {
        const posIcon = event.position === 'A_FAVOR' ? '👍' : event.position === 'CONTRA' ? '👎' : '➖';
        report += `- [${event.date}] ${posIcon} ${event.topic}: ${event.statement}\n`;
      }
    }

    return report;
  }
}

export const coherenceTemporalAgent = new CoherenceTemporalAgent();
