import { Router, Request, Response } from 'express';
import { AdvancedNLPAnalyzer } from '../modules/nlp-advanced';
import { calculateProbability } from '../modules/probability';
import logger from '../core/logger';
// TODO: Add middleware imports when available
// import { authenticateToken } from '../core/middleware';
// import { validateSchema } from '../core/middleware';
// import { analysisSchema } from '../core/schemas';

const router = Router();
const nlpAnalyzer = new AdvancedNLPAnalyzer();

/**
 * POST /api/analyze/advanced
 * Análise avançada de promessas usando novo motor PLN
 * 
 * Body:
 * {
 *   "text": "string (obrigatório)",
 *   "author": "string (opcional)",
 *   "category": "string (opcional)",
 *   "source": "string (opcional)",
 *   "metadata": "object (opcional)"
 * }
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "analysis": {
 *     "promises": [...],
 *     "negations": {...},
 *     "conditions": {...},
 *     "entities": {...},
 *     "sentiment": {...},
 *     "confidence": 0.85
 *   },
 *   "probability": {
 *     "overall": 0.72,
 *     "factors": {...}
 *   },
 *   "timestamp": "ISO8601"
 * }
 */
router.post(
  '/analyze/advanced',
  // authenticateToken,
  // validateSchema(analysisSchema),
  async (req: Request, res: Response) => {
    try {
      const { text, author, category, source, metadata } = req.body;
      const userId = (req as any).user?.id;

      logger.info('Advanced analysis started', {
        userId,
        textLength: text.length,
        author,
        category,
      });

      // Análise PLN avançada
      const nlpAnalysis: any = await nlpAnalyzer.analyzeText(text);

      // Calcular probabilidade de cumprimento
      const probability = (calculateProbability as any)({
        promises: nlpAnalysis.promises,
        author,
        category,
        historicalData: {},
      });

      // Preparar resultado
      const result = {
        analysis: nlpAnalysis,
        probability,
        metadata: {
          author,
          category,
          source,
          customMetadata: metadata,
          analyzedAt: new Date().toISOString(),
          userId,
        },
      };

      // Salvar no banco se autenticado
      if (userId) {
        // TODO: Implement database insert
        // const db = await getDb();
        // if (db) {
        //   try {
        //     await db.run(...)
        //   } catch (dbError) {
        //     logger.warn('Failed to save analysis to database', { dbError });
        //   }
        // }
      }

      logger.info('Advanced analysis completed', {
        userId,
        promiseCount: nlpAnalysis.promises.length,
        confidence: nlpAnalysis.confidence,
        probability: probability.overall,
      });

      res.json(result);
    } catch (error) {
      logger.error('Error in advanced analysis', { error });
      res.status(500).json({
        error: 'Failed to analyze text',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/analyze/batch
 * Análise em lote de múltiplos textos
 * 
 * Body:
 * {
 *   "analyses": [
 *     { "text": "...", "author": "...", ... },
 *     { "text": "...", "author": "...", ... }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "results": [...],
 *   "totalProcessed": 10,
 *   "totalFailed": 0,
 *   "processingTime": 1234
 * }
 */
router.post(
  '/analyze/batch',
  // authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { analyses } = req.body;
      const userId = (req as any).user?.id;

      if (!Array.isArray(analyses) || analyses.length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'analyses must be a non-empty array',
        });
      }

      if (analyses.length > 100) {
        return res.status(400).json({
          error: 'Too many analyses',
          message: 'Maximum 100 analyses per batch',
        });
      }

      logger.info('Batch analysis started', {
        userId,
        count: analyses.length,
      });

      const startTime = Date.now();
      const results = [];
      let failed = 0;

      for (const analysis of analyses) {
        try {
          const { text, author, category, source } = analysis;

          if (!text || typeof text !== 'string') {
            failed++;
            results.push({
              error: 'Invalid text',
              input: analysis,
            });
            continue;
          }

          const nlpAnalysis = await nlpAnalyzer.analyzeText(text);
          const probability = (calculateProbability as any)({
            promises: (nlpAnalysis as any).promises,
            author,
            category,
            historicalData: {},
          });

          results.push({
            success: true,
            analysis: nlpAnalysis,
            probability,
            metadata: { author, category, source },
          });
        } catch (error) {
          failed++;
          results.push({
            error: 'Analysis failed',
            input: analysis,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const processingTime = Date.now() - startTime;

      logger.info('Batch analysis completed', {
        userId,
        totalProcessed: analyses.length,
        totalFailed: failed,
        processingTime,
      });

      res.json({
        results: results as any[],
        totalProcessed: analyses.length,
        totalFailed: failed,
        processingTime,
      });
    } catch (error) {
      logger.error('Error in batch analysis', { error });
      res.status(500).json({
        error: 'Failed to process batch',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/analyze/compare
 * Comparar duas promessas
 * 
 * Query:
 * - text1: string (obrigatório)
 * - text2: string (obrigatório)
 * 
 * Response:
 * {
 *   "similarity": 0.85,
 *   "analysis1": {...},
 *   "analysis2": {...},
 *   "comparison": {
 *     "sameCategory": true,
 *     "sameProbability": false,
 *     "differences": [...]
 *   }
 * }
 */
router.get(
  '/analyze/compare',
  // authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { text1, text2 } = req.query;
      const userId = (req as any).user?.id;

      if (!text1 || !text2 || typeof text1 !== 'string' || typeof text2 !== 'string') {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'text1 and text2 are required strings',
        });
      }

      logger.info('Comparison analysis started', {
        userId,
        text1Length: text1.length,
        text2Length: text2.length,
      });

      const [analysis1, analysis2] = await Promise.all([
        nlpAnalyzer.analyzeText(text1),
        nlpAnalyzer.analyzeText(text2),
      ]) as [any, any];

      // Calcular similaridade
      const similarity = calculateSimilarity(text1, text2);

      // Comparar análises
      const comparison = {
        sameCategory:
          (analysis1 as any).promises.length > 0 &&
          (analysis2 as any).promises.length > 0 &&
          (analysis1 as any).promises[0].category === (analysis2 as any).promises[0].category,
        sameSentiment: analysis1.sentiment.type === analysis2.sentiment.type,
        sameNegation: analysis1.negations.hasNegation === analysis2.negations.hasNegation,
        sameCondition: analysis1.conditions.hasCondition === analysis2.conditions.hasCondition,
        confidenceDifference: Math.abs(analysis1.confidence - analysis2.confidence),
      };

      logger.info('Comparison analysis completed', {
        userId,
        similarity,
        comparison,
      });

      res.json({
        similarity,
        analysis1,
        analysis2,
        comparison,
      });
    } catch (error) {
      logger.error('Error in comparison analysis', { error });
      res.status(500).json({
        error: 'Failed to compare texts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/analyze/history
 * Obter histórico de análises do usuário
 * 
 * Query:
 * - limit: number (padrão: 20)
 * - offset: number (padrão: 0)
 * - category: string (opcional)
 * - author: string (opcional)
 * 
 * Response:
 * {
 *   "analyses": [...],
 *   "total": 100,
 *   "limit": 20,
 *   "offset": 0
 * }
 */
router.get(
  '/analyze/history',
  // authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      const author = req.query.author as string;

      logger.info('History retrieval started', {
        userId,
        limit,
        offset,
        category,
        author,
      });

      // const db = await getDb();
      // if (!db) {
      //   return res.status(503).json({
      //     error: 'Database unavailable',
      //   });
      // }
      const db = null; // TODO: Implement database integration

      // TODO: Implement database queries
      // const db = await getDb();
      // if (!db) {
      //   return res.status(503).json({ error: 'Database unavailable' });
      // }
      const analyses: any[] = [];
      const total = 0;

      logger.info('History retrieval completed', {
        userId,
        count: analyses.length,
        total,
      });

      res.json({
        analyses: analyses.map((a: any) => ({
          id: a.id,
          text: a.text,
          author: a.author,
          category: a.category,
          source: a.source,
          nlpResult: a.nlp_result ? JSON.parse(a.nlp_result) : {},
          probabilityResult: a.probability_result ? JSON.parse(a.probability_result) : {},
          createdAt: a.created_at,
        })),
        total,
        limit,
        offset,
      });
    } catch (error) {
      logger.error('Error retrieving history', { error });
      res.status(500).json({
        error: 'Failed to retrieve history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Calcular similaridade entre dois textos (Levenshtein)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcular distância de Levenshtein
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

export default router;
