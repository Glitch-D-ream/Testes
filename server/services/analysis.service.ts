
import { nanoid } from 'nanoid';
import { getSupabase } from '../core/database.ts';
import { extractPromises } from '../modules/nlp.ts';
import { calculateProbability } from '../modules/probability.ts';
import { aiService } from './ai.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';
import { logError, logInfo } from '../core/logger.ts';
import { DataCompressor } from '../core/compression.ts';
import { MemoryCache } from '../core/cache-l1.ts';

export class AnalysisService {
  async createAnalysis(userId: string | null, text: string, author: string, category: string, extraData: any = {}) {
    let promises;
    let aiAnalysis = null;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    
    try {
      if (openRouterKey && openRouterKey !== 'sua_chave_aqui') {
        try {
          logInfo('[AnalysisService] Tentando DeepSeek R1 via OpenRouter...');
          aiAnalysis = await deepSeekService.analyzeText(text, openRouterKey);
        } catch (dsError) {
          logError('[AnalysisService] Falha no DeepSeek R1, tentando fallback para AIService padrão', dsError as Error);
          aiAnalysis = await aiService.analyzeText(text);
        }
      } else {
        logInfo('[AnalysisService] Utilizando AIService padrão (Pollinations)...');
        aiAnalysis = await aiService.analyzeText(text);
      }

      promises = aiAnalysis.promises.map(p => ({
        text: p.text,
        confidence: p.confidence,
        category: p.category,
        negated: p.negated,
        conditional: p.conditional,
        reasoning: p.reasoning,
        risks: (p as any).risks || []
      }));
    } catch (error) {
      logError('Fallback para NLP local devido a erro na IA', error as Error);
      promises = extractPromises(text);
    }
    
    const analysisId = nanoid();
    const probabilityScore = await calculateProbability(promises, author, category);

    try {
      const supabase = getSupabase();

      // Salvar análise no Supabase (com compressão de dados pesados)
      // Nota: Removidos campos total_budget, executed_budget, execution_rate e metadata 
      // pois as colunas não existem no banco de dados atual.
      const { error: analysisError } = await supabase
        .from('analyses')
        .insert([{
          id: analysisId,
          user_id: userId,
          text,
          author,
          category,
          extracted_promises: DataCompressor.compress(promises),
          probability_score: probabilityScore
        }]);

      if (analysisError) {
        logError('Erro ao salvar análise no Supabase', analysisError as any);
      }

      // Salvar promessas individuais
      if (promises.length > 0) {
      const promisesToInsert = promises.map(p => ({
        id: nanoid(),
        analysis_id: analysisId,
        promise_text: p.text,
        category: p.category,
        confidence_score: p.confidence,
        extracted_entities: (p as any).entities || {},
        negated: p.negated || false,
        conditional: p.conditional || false,
        risks: p.risks || []
      }));

        // Remover campo 'risks' se a coluna não existir no banco
        const promisesToInsertClean = promisesToInsert.map(({ risks, ...rest }) => rest);
        
        const { error: promisesError } = await supabase
          .from('promises')
          .insert(promisesToInsertClean);

        if (promisesError) {
          logError('Erro ao salvar promessas no Supabase', promisesError as any);
        }
      }
    } catch (dbError) {
      logError('Sistema operando sem persistência em banco de dados', dbError as Error);
    }

    return {
      id: analysisId,
      text,
      probabilityScore,
      promisesCount: promises.length,
      promises,
      totalBudget: extraData.totalBudget || 0,
      executedBudget: extraData.executedBudget || 0,
      executionRate: extraData.executionRate || 0,
    };
  }

  async getAnalysisById(id: string) {
    // 1. Tentar Cache L1 primeiro
    const cached = MemoryCache.get(`analysis:${id}`);
    if (cached) {
      logInfo(`[AnalysisService] Cache L1 Hit: analysis:${id}`);
      return cached;
    }

    const supabase = getSupabase();
    
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (analysisError || !analysis) return null;

    // 2. Descomprimir dados se necessário
    if (analysis.extracted_promises && DataCompressor.isCompressed(analysis.extracted_promises as any)) {
      analysis.extracted_promises = DataCompressor.decompress(analysis.extracted_promises as any);
    }

    const { data: promises, error: promisesError } = await supabase
      .from('promises')
      .select('*')
      .eq('analysis_id', id);

    const result = {
      ...analysis,
      promises: promises || [],
      extracted_promises: analysis.extracted_promises || [],
    };

    // 3. Salvar no Cache L1 para próximas requisições
    MemoryCache.set(`analysis:${id}`, result);
    
    return result;
  }

  async listAnalyses(limit: number = 50, offset: number = 0) {
    const supabase = getSupabase();
    
    const { data: analyses, error, count } = await supabase
      .from('analyses')
      .select('id, author, category, probability_score, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logError('Erro ao listar análises', error as any);
      return { analyses: [], total: 0 };
    }

    return {
      analyses: analyses || [],
      total: count || 0,
    };
  }
}

export const analysisService = new AnalysisService();
