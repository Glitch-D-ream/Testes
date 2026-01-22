import { nanoid } from 'nanoid';
import { runQuery, getQuery, allQuery } from '../core/database.js';
import { extractPromises } from '../modules/nlp.js';
import { calculateProbability } from '../modules/probability.js';
import { aiService } from './ai.service.js';

export class AnalysisService {
  async createAnalysis(userId: string | null, text: string, author: string, category: string) {
    // Tentar análise avançada com IA primeiro, fallback para NLP local se falhar
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
      console.error('Fallback para NLP local devido a erro na IA:', error);
      promises = extractPromises(text);
    }
    const analysisId = nanoid();

    // Calcular probabilidade (Agora é assíncrono devido à integração com dados reais)
    const probabilityScore = await calculateProbability(promises, author, category);

    // Salvar análise
    await runQuery(
      `INSERT INTO analyses (id, user_id, text, author, category, extracted_promises, probability_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [analysisId, userId, text, author, category, JSON.stringify(promises), probabilityScore]
    );

    // Salvar promessas individuais
    for (const promise of promises) {
      const promiseId = nanoid();
      await runQuery(
        `INSERT INTO promises (id, analysis_id, promise_text, category, confidence_score)
         VALUES (?, ?, ?, ?, ?)`,
        [promiseId, analysisId, promise.text, promise.category, promise.confidence]
      );
    }

    return {
      id: analysisId,
      probabilityScore,
      promisesCount: promises.length,
      promises,
    };
  }

  async getAnalysisById(id: string) {
    const analysis = await getQuery(
      'SELECT * FROM analyses WHERE id = ?',
      [id]
    );

    if (!analysis) return null;

    const promises = await allQuery(
      'SELECT * FROM promises WHERE analysis_id = ?',
      [id]
    );

    return {
      ...analysis,
      promises,
      extracted_promises: JSON.parse(analysis.extracted_promises || '[]'),
    };
  }

  async listAnalyses(limit: number = 50, offset: number = 0) {
    const analyses = await allQuery(
      `SELECT id, author, category, probability_score, created_at
       FROM analyses
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = await getQuery('SELECT COUNT(*) as count FROM analyses');

    return {
      analyses,
      total: total.count,
    };
  }
}

export const analysisService = new AnalysisService();
