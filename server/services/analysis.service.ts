
import { nanoid } from 'nanoid';
import { getSupabase } from '../core/database.ts';
import { extractPromises } from '../modules/nlp.ts';
import { calculateProbability } from '../modules/probability.ts';
import { aiService } from './ai.service.ts';
import { deepSeekService } from './ai-deepseek.service.ts';
import { logError, logInfo } from '../core/logger.ts';
import { DataCompressor } from '../core/compression.ts';
import { MemoryCache } from '../core/cache-l1.ts';
import { ValueExtractor } from '../modules/value-extractor.ts';

export class AnalysisService {
  async createAnalysis(userId: string | null, text: string, author: string, category: string, extraData: any = {}) {
    let promises;
    let aiAnalysis = null;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    // Validar se o userId é um UUID válido para o Supabase
    const validUserId = (userId && userId.length === 36) ? userId : null;
    
    try {
      // Priorizar Groq via aiService.analyzeText (que já foi otimizado)
      logInfo('[AnalysisService] Iniciando análise estruturada...');
      aiAnalysis = await aiService.analyzeText(text);

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
    
    // Extrair valores financeiros para enriquecer a análise
    const estimatedValue = ValueExtractor.extractFromIAResponse(aiAnalysis, text);
    const enrichedPromises = promises.map(p => ({
      ...p,
      estimatedValue: p.estimatedValue || estimatedValue // Propaga o valor para as promessas individuais
    }));

    const probabilityScore = await calculateProbability(enrichedPromises, author, category);

    try {
      const supabase = getSupabase();

      // Salvar análise no Supabase (com compressão de dados pesados)
      const { error: analysisError } = await supabase
        .from('analyses')
        .insert([{
          id: analysisId,
          user_id: validUserId,
          text,
          author,
          category,
          extracted_promises: DataCompressor.compress(promises),
          probability_score: probabilityScore,
          data_sources: {
            consensusMetrics: extraData.consensusMetrics || {},
            absenceReport: extraData.absenceReport || null,
            trajectoryAnalysis: extraData.trajectoryAnalysis || null
          }
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
      promisesCount: enrichedPromises.length,
      promises: enrichedPromises,
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
