import { FilteredSource } from './filter.js';
import { logInfo, logError } from '../core/logger.js';
import { getSupabase } from '../core/database.js';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
import { getDeputadoId, getVotacoesDeputado, analisarIncoerencia } from '../integrations/camara.js';
import { getSenadorCodigo, getVotacoesSenador } from '../integrations/senado.js';

export class BrainAgent {
  /**
   * O Cérebro Central 3.0: Restaurado para Máxima Profundidade e Utilidade
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null, existingAnalysisId: string | null = null) {
    logInfo(`[Brain] Iniciando análise profunda para: ${politicianName}`);
    
    try {
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

      // 4. Construção do Relatório de Inteligência (O "Dossiê")
      const fullContext = `
# 📑 Dossiê de Inteligência Política: ${politicianName}

## 📊 Perfil e Histórico Recente
${historyContext}

## 💰 Análise de Viabilidade Financeira (Dados Oficiais SICONFI)
**Categoria Analisada:** ${mainCategory}
**Veredito do Tesouro:** ${budgetViability.reason}
**Status de Viabilidade:** ${budgetViability.viable ? '✅ VIÁVEL' : '⚠️ DESAFIADOR'}
**Nível de Confiança dos Dados:** ${Math.round(budgetViability.confidence * 100)}%

## ⚠️ Riscos de Descumprimento (Análise de Cenários)
*   **Risco Orçamentário:** A dependência de repasses federais ou excesso de gastos obrigatórios pode inviabilizar novos investimentos nesta área.
*   **Risco Político:** A falta de maioria legislativa ou oposição direta a projetos similares no passado aumenta a dificuldade de execução.
*   **Risco de Execução:** Promessas sem cronograma claro ou fontes de custeio definidas tendem a ser meramente protocolares.

## 🔍 Evidências Coletadas e Auditadas
Abaixo, os registros brutos que fundamentam esta análise, extraídos de fontes públicas e verificadas:

${knowledgeBase}

---
*Este relatório foi gerado pela Tríade de Agentes (Scout, Filter, Brain) com foco em utilidade pública e transparência.*
      `;
      
      let analysis;
      if (existingAnalysisId) {
        analysis = await this.updateExistingAnalysis(existingAnalysisId, fullContext, politicianName, mainCategory);
      } else {
        const { analysisService } = await import('../services/analysis.service.js');
        analysis = await analysisService.createAnalysis(userId, fullContext, politicianName, mainCategory);
      }

      logInfo(`[Brain] Análise concluída com sucesso para ${politicianName}.`);
      
      return {
        ...analysis,
        budgetViability,
        mainCategory
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
    const { calculateProbability } = await import('../modules/probability.js');
    const { nanoid } = await import('nanoid');
    const supabase = getSupabase();

    // A IA agora gera um JSON rico baseado no prompt restaurado
    const aiAnalysis = await aiService.analyzeText(text);
    
    const promises = aiAnalysis.promises.map(p => ({
      text: p.text,
      confidence: p.confidence,
      category: p.category,
      negated: p.negated,
      conditional: p.conditional,
      reasoning: p.reasoning,
      risks: p.risks || [],
      evidenceSnippet: text.substring(0, 1000), // Contexto rico
      sourceName: 'Múltiplas Fontes Auditadas',
      newsTitle: 'Análise Consolidada',
      legislativeIncoherence: null as string | null,
      legislativeSourceUrl: null as string | null
    }));

    // Detector de Incoerência Legislativa (Diz vs Faz)
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
        probability_score_details: {
          ...probabilityScore.details,
          verdict: aiAnalysis.verdict
        },
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Salvar promessas individuais para o Dossiê
    if (promises.length > 0) {
      const promisesToInsert = promises.map(p => ({
        id: nanoid(),
        analysis_id: id,
        promise_text: p.text,
        category: p.category,
        confidence_score: p.confidence,
        extracted_entities: {},
        negated: p.negated || false,
        conditional: p.conditional || false,
        evidence_snippet: p.evidenceSnippet,
        source_name: p.sourceName,
        news_title: p.newsTitle,
        legislative_incoherence: p.legislativeIncoherence,
        legislative_source_url: p.legislativeSourceUrl,
        risks: p.risks || []
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
