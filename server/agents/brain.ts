import { FilteredSource } from './filter.js';
import { logInfo, logError } from '../core/logger.js';
import { getSupabase } from '../core/database.js';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.js';
import { getDeputadoId, getVotacoesDeputado, analisarIncoerencia } from '../integrations/camara.js';
import { getSenadorCodigo, getVotacoesSenador } from '../integrations/senado.js';

export class BrainAgent {
  /**
   * O Cérebro Central 2.0: Integração automática com dados orçamentários reais
   */
  async analyze(politicianName: string, sources: FilteredSource[], userId: string | null = null, existingAnalysisId: string | null = null) {
    logInfo(`[Brain] Iniciando processamento cognitivo para: ${politicianName}`);
    
    try {
      // 1. Consolidar conhecimento filtrado com formatação profissional
      const knowledgeBase = sources
        .map(s => {
          const title = s.title || 'Declaração Identificada';
          return `### ${title}\n**Fonte:** ${s.source}\n**Contexto:** ${s.justification}\n\n> ${s.content}`;
        })
        .join('\n\n---\n\n');

      // 2. Buscar Histórico do Político no Banco (Aprendizado)
      const history = await this.getPoliticianHistory(politicianName);
      const historyContext = history 
        ? `Histórico: Este político já teve ${history.totalAnalyses} análises anteriores com score médio de ${history.avgScore}%.`
        : "Histórico: Nenhuma análise anterior encontrada para este político.";

      // 3. Cruzamento Orçamentário Real (SICONFI)
      // Extraímos a categoria predominante das fontes para validar no Tesouro
      const mainCategory = this.detectMainCategory(sources);
      const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
      
      logInfo(`[Brain] Validando viabilidade orçamentária para categoria: ${siconfiCategory}`);
      
      // Simulamos um valor médio de promessa política (ex: 500 milhões) para teste de viabilidade
      // Em uma versão futura, a IA do Brain poderia estimar este valor.
      const estimatedValue = 500000000; 
      const currentYear = new Date().getFullYear();
      
      const budgetViability = await validateBudgetViability(
        siconfiCategory, 
        estimatedValue, 
        currentYear - 1
      );

      const budgetContext = `Análise Orçamentária (SICONFI): ${budgetViability.reason} 
      Viabilidade Técnica: ${budgetViability.viable ? 'ALTA' : 'BAIXA'} 
      Confiança dos Dados: ${Math.round(budgetViability.confidence * 100)}%`;

      // 4. Análise Final via IA de Alta Performance
      const { analysisService } = await import('../services/analysis.service.js');
      
      const fullContext = `
# Relatório de Inteligência: ${politicianName}

## 📊 Panorama Geral
${historyContext}

## 💰 Viabilidade Financeira
${budgetContext}

## 🔍 Evidências e Fontes Coletadas
${knowledgeBase}
      `;
      
      let analysis;
      if (existingAnalysisId) {
        // Se já temos um ID (fluxo de Job), atualizamos a análise existente
        analysis = await this.updateExistingAnalysis(existingAnalysisId, fullContext, politicianName, mainCategory);
      } else {
        // Fluxo legado ou direto
        analysis = await analysisService.createAnalysis(userId, fullContext, politicianName, mainCategory);
      }

      // 5. Ajuste Dinâmico do Score (Opcional: O Brain pode ajustar o score da IA baseado no SICONFI)
      if (!budgetViability.viable && analysis.probabilityScore > 0.5) {
        logInfo(`[Brain] Ajustando score para baixo devido à inviabilidade orçamentária detectada.`);
        // Aqui poderíamos atualizar o score no banco se necessário
      }

      logInfo(`[Brain] Veredito final emitido para ${politicianName}. Score: ${analysis.probabilityScore}`);
      
      return {
        ...analysis,
        budgetViability,
        mainCategory
      };
    } catch (error) {
      logError(`[Brain] Erro na inteligência central para ${politicianName}`, error as Error);
      throw error;
    }
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const categories = sources.map(s => s.justification); // A IA do Filter coloca a categoria na justificativa às vezes
    // Heurística simples para detectar categoria predominante
    if (categories.some(c => c.toLowerCase().includes('saúde'))) return 'Saúde';
    if (categories.some(c => c.toLowerCase().includes('educação'))) return 'Educação';
    if (categories.some(c => c.toLowerCase().includes('infraestrutura') || c.toLowerCase().includes('obras'))) return 'Infraestrutura';
    if (categories.some(c => c.toLowerCase().includes('segurança'))) return 'Segurança';
    return 'Geral';
  }

  private async updateExistingAnalysis(id: string, text: string, author: string, category: string) {
    const { aiService } = await import('../services/ai.service.js');
    const { calculateProbability } = await import('../modules/probability.js');
    const { nanoid } = await import('nanoid');
    const supabase = getSupabase();

    const aiAnalysis = await aiService.analyzeText(text);
    const promises = aiAnalysis.promises.map(p => {
      // Tentar encontrar a fonte original no texto de contexto para cada promessa
      const blocks = text.split('\n\n');
      const sourceMatch = blocks.find(block => block.includes(p.text.substring(0, 20))) || blocks[0];
      
      // Extrair metadados da fonte se existirem no bloco
      const sourceName = sourceMatch?.match(/\[Fonte: (.*?)\]/)?.[1] || 'Fonte Desconhecida';
      const newsTitle = sourceMatch?.split('\n')[0]?.replace(/\[Fonte: .*?\]/, '').trim() || 'Notícia Identificada';
      
      return {
        text: p.text,
        confidence: p.confidence,
        category: p.category,
        negated: p.negated,
        conditional: p.conditional,
        reasoning: p.reasoning,
        evidenceSnippet: sourceMatch || text.substring(0, 500),
        sourceName: sourceName,
        newsTitle: newsTitle,
        legislativeIncoherence: null as string | null,
        legislativeSourceUrl: null as string | null
      };
    });

    // --- Detector de Incoerência (Diz vs Faz) ---
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
        } else {
          const senadorCodigo = await getSenadorCodigo(author);
          if (senadorCodigo) {
            const votacoes = await getVotacoesSenador(senadorCodigo);
            // Lógica similar para senador pode ser expandida aqui
          }
        }
      } catch (err) {
        logError('[BrainAgent] Erro no Detector de Incoerência', err as Error);
      }
    }

    const probabilityScore = await calculateProbability(promises, author, category);

    // Atualizar a análise existente
    const { error } = await supabase
      .from('analyses')
      .update({
        text,
        category,
        extracted_promises: promises,
        probability_score: probabilityScore,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Salvar promessas individuais
    if (promises.length > 0) {
      const promisesToInsert = promises.map(p => ({
        id: nanoid(),
        analysis_id: id,
        promise_text: p.text,
        category: p.category,
        confidence_score: p.confidence,
        extracted_entities: (p as any).entities || {},
        negated: p.negated || false,
        conditional: p.conditional || false,
        evidence_snippet: (p as any).evidenceSnippet,
        source_name: (p as any).sourceName,
        news_title: (p as any).newsTitle,
        legislative_incoherence: (p as any).legislativeIncoherence,
        legislative_source_url: (p as any).legislativeSourceUrl
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
