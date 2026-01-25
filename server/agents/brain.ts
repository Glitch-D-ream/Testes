import { FilteredSource } from './filter.js';
import { logInfo, logError, logWarn } from '../core/logger.js';
import { getSupabase } from '../core/database.js';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
import { getDeputadoId, getVotacoesDeputado, analisarIncoerencia } from '../integrations/camara.js';
import { getSenadorCodigo, getVotacoesSenador } from '../integrations/senado.js';
import { cacheService } from '../services/cache.service.js';
import { temporalIncoherenceService } from '../services/temporal-incoherence.service.js';

export class BrainAgent {
  /**
   * O Cérebro Central 3.0: Com Cache, Resiliência e Análise de Incoerência Temporal
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null, existingAnalysisId: string | null = null) {
    logInfo(`[Brain] Iniciando análise profunda para: ${politicianName}`);
    
    try {
      // 0. Verificar Cache
      const cachedAnalysis = await cacheService.getAnalysis(politicianName);
      if (cachedAnalysis) {
        logInfo(`[Brain] Análise recuperada do cache para: ${politicianName}`);
        return cachedAnalysis;
      }
      
      logWarn(`[Brain] Análise não encontrada em cache. Executando análise completa...`);

      // 1. Base de Conhecimento Rica
      const knowledgeBase = sources
        .map(s => {
          const title = s.title || 'Declaração Identificada';
          return `### ${title}\n**Fonte:** ${s.source} | **Data:** ${s.publishedAt || 'Recente'}\n\n> ${s.content}\n\n**Análise de Contexto:** ${s.justification}`;
        })
        .join('\n\n---\n\n');

      // 2. Histórico e Aprendizado
      const history = await this.getPoliticianHistory(politicianName);
      const historyContext = history 
        ? `Este político possui um histórico de ${history.totalAnalyses} análises no sistema, com uma média de confiabilidade de ${history.avgScore}%.`
        : "Este é o primeiro registro detalhado deste político em nossa base de dados em tempo real.";

      // 3. Validação Orçamentária (SICONFI)
      const mainCategory = this.detectMainCategory(sources);
      const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
      const currentYear = new Date().getFullYear();
      
      const budgetViability = await validateBudgetViability(siconfiCategory, 500000000, currentYear - 1);

      // 4. NOVO: Análise de Incoerência Temporal (Diz vs Faz)
      const promiseTexts = sources.map(s => s.content).filter(c => c && c.length > 0);
      const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(politicianName, promiseTexts);

      const temporalSection = temporalAnalysis.hasIncoherence
        ? `## 🔄 ANÁLISE DE INCOERÊNCIA TEMPORAL (DIZ VS FAZ)
**Coerência Histórica:** ${temporalAnalysis.coherenceScore}%

${temporalAnalysis.contradictions.map(c => 
  `- **${c.promiseText}** vs Votação em ${c.votedAgainstOn}: ${c.votedAgainstBill} (Severidade: ${c.severity.toUpperCase()})`
).join('\n')}

**Resumo:** ${temporalAnalysis.summary}

---

`
        : `## 🔄 ANÁLISE DE INCOERÊNCIA TEMPORAL (DIZ VS FAZ)
**Coerência Histórica:** ${temporalAnalysis.coherenceScore}%

${temporalAnalysis.summary}

---

`;

      // 5. Construção do Relatório de Inteligência (O "Dossiê")
      const fullContext = `
# 📑 DOSSIÊ DE INTELIGÊNCIA POLÍTICA: ${politicianName.toUpperCase()}

---

## 📊 1. PERFIL E CONTEXTO HISTÓRICO
${historyContext}

---

## 💰 2. ANÁLISE DE VIABILIDADE FINANCEIRA (SICONFI)
> **Foco Setorial:** ${mainCategory}

| Indicador | Status |
| :--- | :--- |
| **Veredito Técnico** | ${budgetViability.reason} |
| **Viabilidade Estimada** | ${budgetViability.viable ? '✅ ALTA VIABILIDADE' : '⚠️ EXECUÇÃO COMPLEXA'} |
| **Confiança dos Dados** | ${Math.round(budgetViability.confidence * 100)}% |

---

## ⚠️ 3. MATRIZ DE RISCOS (ANÁLISE DE CENÁRIOS)
Abaixo, os principais obstáculos identificados que podem impedir o cumprimento das promessas:

*   **📉 RISCO ORÇAMENTÁRIO:** Rigidez fiscal e dependência de fontes externas de financiamento.
*   **⚖️ RISCO POLÍTICO:** Necessidade de articulação legislativa e histórico de oposição a pautas similares.
*   **⚙️ RISCO OPERACIONAL:** Complexidade logística e ausência de cronogramas técnicos detalhados.

---

${temporalSection}

## 🔍 5. EVIDÊNCIAS AUDITADAS (FONTES PÚBLICAS)
Os registros abaixo foram extraídos, sanitizados e validados pela Tríade de Agentes:

${knowledgeBase}

---
*Este relatório é um documento de utilidade pública gerado de forma autônoma pela Tríade de Agentes (Scout, Filter, Brain). A análise é baseada em dados públicos e algoritmos de inteligência artificial.*
      `;
      
      let analysis;
      if (existingAnalysisId) {
        analysis = await this.updateExistingAnalysis(existingAnalysisId, fullContext, politicianName, mainCategory);
      } else {
        const { analysisService } = await import('../services/analysis.service.js');
        analysis = await analysisService.createAnalysis(userId, fullContext, politicianName, mainCategory);
      }

      // Salvar em cache para futuras consultas
      await cacheService.saveAnalysis(politicianName, {
        ...analysis,
        budgetViability,
        mainCategory,
        temporalAnalysis
      }).catch(err => logWarn('[Brain] Erro ao salvar em cache', err));

      logInfo(`[Brain] Análise concluída com sucesso para ${politicianName}.`);
      
      return {
        ...analysis,
        budgetViability,
        mainCategory,
        temporalAnalysis
      };
    } catch (error) {
      logError(`[Brain] Falha na análise profunda de ${politicianName}`, error as Error);
      throw error;
    }
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const text = sources.map(s => (s.title + ' ' + s.content).toLowerCase()).join(' ');
    if (text.includes('saúde') || text.includes('hospital') || text.includes('médico')) return 'Saúde';
    if (text.includes('educação') || text.includes('escola') || text.includes('ensino')) return 'Educação';
    if (text.includes('segurança') || text.includes('polícia') || text.includes('crime')) return 'Segurança';
    if (text.includes('economia') || text.includes('imposto') || text.includes('pib')) return 'Economia';
    if (text.includes('infraestrutura') || text.includes('obras') || text.includes('estrada')) return 'Infraestrutura';
    return 'Geral';
  }

  private async updateExistingAnalysis(id: string, text: string, author: string, category: string) {
    const { aiService } = await import('../services/ai.service.js');
    const { deepSeekService } = await import('../services/ai-deepseek.service.js');
    const { calculateProbability } = await import('../modules/probability.js');
    const { nanoid } = await import('nanoid');
    const supabase = getSupabase();

    let aiAnalysis;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    if (openRouterKey && openRouterKey !== 'sua_chave_aqui') {
      try {
        logInfo('[Brain] Utilizando DeepSeek R1 para análise de raciocínio profundo...');
        aiAnalysis = await deepSeekService.analyzeText(text, openRouterKey);
      } catch (err) {
        logError('[Brain] Falha no DeepSeek R1, recorrendo ao AIService padrão', err as Error);
        aiAnalysis = await aiService.analyzeText(text);
      }
    } else {
      aiAnalysis = await aiService.analyzeText(text);
    }
    
    const promises = aiAnalysis.promises.map(p => ({
      text: p.text,
      confidence: p.confidence,
      category: p.category,
      negated: p.negated,
      conditional: p.conditional,
      reasoning: p.reasoning,
      risks: p.risks || [],
      evidenceSnippet: text.substring(0, 1000),
      sourceName: 'Múltiplas Fontes Auditadas',
      newsTitle: 'Análise Consolidada',
      legislativeIncoherence: null as string | null,
      legislativeSourceUrl: null as string | null
    }));

    if (author) {
      try {
        const deputadoId = await getDeputadoId(author);
        if (deputadoId) {
          const votacoes = await getVotacoesDeputado(deputadoId);
          for (const p of promises) {
            for (const v of votacoes) {
              const analise = analisarIncoerencia(p.text, v);
              if (analise.incoerente) {
                p.legislativeIncoherence = analise.justificativa;
                p.legislativeSourceUrl = `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${v.idVotacao}`;
                break;
              }
            }
          }
        }
      } catch (err) {
        logError('[BrainAgent] Erro no cruzamento legislativo', err as Error);
      }
    }

    const probabilityScore = await calculateProbability(promises, author, category);

    const { error } = await supabase
      .from('analyses')
      .update({
        text,
        category,
        extracted_promises: promises,
        probability_score: probabilityScore.score,
        methodology_notes: JSON.stringify({
          factors: probabilityScore.factors,
          details: probabilityScore.details,
          verdict: aiAnalysis.verdict
        }),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    if (promises.length > 0) {
      const promisesToInsert = promises.map(p => ({
        id: nanoid(),
        analysis_id: id,
        promise_text: p.text,
        category: p.category,
        confidence_score: p.confidence,
        extracted_entities: { 
          risks: p.risks || [],
          legislative_incoherence: p.legislativeIncoherence,
          legislative_source_url: p.legislativeSourceUrl
        },
        negated: p.negated || false,
        conditional: p.conditional || false,
        evidence_snippet: p.evidenceSnippet,
        source_name: p.sourceName,
        news_title: p.newsTitle
      }));
      await supabase.from('promises').insert(promisesToInsert);
    }

    return { id, probabilityScore, promises };
  }

  private async getPoliticianHistory(name: string) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('analyses')
        .select('probability_score')
        .ilike('author', `%${name}%`)
        .eq('status', 'completed');

      if (error || !data || data.length === 0) return null;

      const totalAnalyses = data.length;
      const avgScore = data.reduce((acc, curr) => acc + (curr.probability_score || 0), 0) / totalAnalyses;

      return { totalAnalyses, avgScore: Math.round(avgScore * 100) };
    } catch {
      return null;
    }
  }
}

export const brainAgent = new BrainAgent();
