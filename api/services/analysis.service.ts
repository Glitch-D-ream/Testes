
import { nanoid } from 'nanoid';
import { getSupabase } from '../core/database.js';
import { extractPromises } from '../modules/nlp.js';
import { calculateProbability } from '../modules/probability.js';
import { aiService } from './ai.service.js';
import { logError, logInfo } from '../core/logger.js';

export class AnalysisService {
  async createAnalysis(userId: string | null, text: string, author: string, category: string) {
    let promises;
    let aiAnalysis = null;
    
    try {
      aiAnalysis = await aiService.analyzeText(text);
      promises = aiAnalysis.promises.map(p => ({
        text: p.text,
        confidence: p.confidence,
        category: p.category,
        negated: p.negated,
        conditional: p.conditional,
        reasoning: p.reasoning
      }));
    } catch (error) {
      logError('Fallback para NLP local devido a erro na IA', error as Error);
      promises = extractPromises(text);
    }
    
    const analysisId = nanoid();
    const probabilityScore = await calculateProbability(promises, author, category);

    const supabase = getSupabase();

    // Salvar análise no Supabase
    const { error: analysisError } = await supabase
      .from('analyses')
      .insert([{
        id: analysisId,
        user_id: userId,
        text,
        author,
        category,
        extracted_promises: promises,
        probability_score: probabilityScore
      }]);

    if (analysisError) {
      logError('Erro ao salvar análise no Supabase', analysisError as any);
      throw analysisError;
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
        conditional: p.conditional || false
      }));

      const { error: promisesError } = await supabase
        .from('promises')
        .insert(promisesToInsert);

      if (promisesError) {
        logError('Erro ao salvar promessas no Supabase', promisesError as any);
      }
    }

    return {
      id: analysisId,
      probabilityScore,
      promisesCount: promises.length,
      promises,
    };
  }

  async getAnalysisById(id: string) {
    const supabase = getSupabase();
    
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (analysisError || !analysis) return null;

    const { data: promises, error: promisesError } = await supabase
      .from('promises')
      .select('*')
      .eq('analysis_id', id);

    return {
      ...analysis,
      promises: promises || [],
      extracted_promises: analysis.extracted_promises || [],
    };
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
