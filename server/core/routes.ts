import { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { authMiddleware, optionalAuthMiddleware, requestLoggerMiddleware } from './middleware.js';
import { validate, AnalysisSchema } from './schemas.js';
import { allQuery, runQuery, getQuery, createAuditLog } from './database.js';
import { extractPromises } from '../modules/nlp.js';
import { calculateProbability } from '../modules/probability.js';
import { logInfo, logError } from './logger.js';
import authRoutes from '../routes/auth.js';

/**
 * Rate limiters
 */
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: Request) => {
    // Usuários autenticados: 50 por dia
    // Usuários anônimos: 10 por hora
    return req.user ? 50 : 10;
  },
  message: 'Muitas análises. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Configura todas as rotas da API
 */
export function setupRoutes(app: Express): void {
  // Middleware global
  app.use(requestLoggerMiddleware);

  // Rotas de autenticação
  app.use('/api/auth', loginLimiter, authRoutes);

  /**
   * POST /api/analyze
   * Submete um texto para análise
   */
  app.post('/api/analyze', optionalAuthMiddleware, analysisLimiter, async (req: Request, res: Response) => {
    try {
      const validation = validate(AnalysisSchema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { text, author, category } = validation.data;
      const analysisId = nanoid();
      const userId = req.userId || null;

      // Extrair promessas
      const promises = extractPromises(text);

      // Calcular probabilidade
      const probabilityScore = calculateProbability(promises, category);

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

      // Log de auditoria
      const logId = nanoid();
      await createAuditLog(
        logId,
        userId,
        'ANALYSIS_CREATED',
        'analysis',
        analysisId,
        req.ip || null,
        req.get('user-agent') || null
      );

      logInfo('Análise criada', { analysisId, userId, promisesCount: promises.length });

      res.status(201).json({
        id: analysisId,
        probabilityScore,
        promisesCount: promises.length,
        promises,
      });
    } catch (error) {
      logError('Erro ao criar análise', error as Error);
      res.status(500).json({ error: 'Erro ao criar análise' });
    }
  });

  /**
   * GET /api/analysis/:id
   * Obtém uma análise específica
   */
  app.get('/api/analysis/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const analysis = await getQuery(
        'SELECT * FROM analyses WHERE id = ?',
        [id]
      );

      if (!analysis) {
        res.status(404).json({ error: 'Análise não encontrada' });
        return;
      }

      const promises = await allQuery(
        'SELECT * FROM promises WHERE analysis_id = ?',
        [id]
      );

      res.json({
        ...analysis,
        promises,
        extracted_promises: JSON.parse(analysis.extracted_promises || '[]'),
      });
    } catch (error) {
      logError('Erro ao obter análise', error as Error);
      res.status(500).json({ error: 'Erro ao obter análise' });
    }
  });

  /**
   * GET /api/analyses
   * Lista análises (últimas 50)
   */
  app.get('/api/analyses', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const analyses = await allQuery(
        `SELECT id, author, category, probability_score, created_at
         FROM analyses
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const total = await getQuery('SELECT COUNT(*) as count FROM analyses');

      res.json({
        analyses,
        total: total.count,
        limit,
        offset,
      });
    } catch (error) {
      logError('Erro ao listar análises', error as Error);
      res.status(500).json({ error: 'Erro ao listar análises' });
    }
  });

  /**
   * GET /api/analysis/:id/export
   * Exporta uma análise em JSON
   */
  app.get('/api/analysis/:id/export', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const analysis = await getQuery(
        'SELECT * FROM analyses WHERE id = ?',
        [id]
      );

      if (!analysis) {
        res.status(404).json({ error: 'Análise não encontrada' });
        return;
      }

      const promises = await allQuery(
        'SELECT * FROM promises WHERE analysis_id = ?',
        [id]
      );

      const exportData = {
        analysis: {
          id: analysis.id,
          text: analysis.text,
          author: analysis.author,
          category: analysis.category,
          probabilityScore: analysis.probability_score,
          createdAt: analysis.created_at,
        },
        promises,
        methodology: {
          description: 'Análise de viabilidade de promessas políticas',
          factors: [
            'Especificidade da promessa (25%)',
            'Conformidade histórica (25%)',
            'Viabilidade orçamentária (20%)',
            'Realismo do prazo (15%)',
            'Histórico do autor (15%)',
          ],
          disclaimer: 'Esta análise é probabilística e não acusatória. Baseada em padrões linguísticos e dados históricos.',
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analise-${id}.json"`);
      res.json(exportData);

      // Log de auditoria
      const logId = nanoid();
      await createAuditLog(
        logId,
        req.userId || null,
        'ANALYSIS_EXPORTED',
        'analysis',
        id,
        req.ip || null,
        req.get('user-agent') || null
      );
    } catch (error) {
      logError('Erro ao exportar análise', error as Error);
      res.status(500).json({ error: 'Erro ao exportar análise' });
    }
  });

  /**
   * DELETE /api/user/data
   * Deleta todos os dados do usuário (direito ao esquecimento)
   */
  app.delete('/api/user/data', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      // Soft delete das análises do usuário
      await runQuery(
        'UPDATE analyses SET text = NULL, author = NULL WHERE user_id = ?',
        [userId]
      );

      // Deletar refresh tokens
      await runQuery(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );

      // Log de auditoria
      const logId = nanoid();
      await createAuditLog(
        logId,
        userId,
        'USER_DATA_DELETED',
        'user',
        userId,
        req.ip || null,
        req.get('user-agent') || null
      );

      logInfo('Dados do usuário deletados', { userId });

      res.json({ message: 'Dados deletados com sucesso' });
    } catch (error) {
      logError('Erro ao deletar dados do usuário', error as Error);
      res.status(500).json({ error: 'Erro ao deletar dados' });
    }
  });

  /**
   * GET /api/user/data/export
   * Exporta todos os dados do usuário (direito de portabilidade)
   */
  app.get('/api/user/data/export', authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const user = await getQuery(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      const analyses = await allQuery(
        'SELECT * FROM analyses WHERE user_id = ?',
        [userId]
      );

      const auditLogs = await allQuery(
        'SELECT * FROM audit_logs WHERE user_id = ?',
        [userId]
      );

      const exportData = {
        user,
        analyses,
        auditLogs,
        exportedAt: new Date().toISOString(),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dados-usuario-${userId}.json"`);
      res.json(exportData);

      // Log de auditoria
      const logId = nanoid();
      await createAuditLog(
        logId,
        userId,
        'USER_DATA_EXPORTED',
        'user',
        userId,
        req.ip || null,
        req.get('user-agent') || null
      );
    } catch (error) {
      logError('Erro ao exportar dados do usuário', error as Error);
      res.status(500).json({ error: 'Erro ao exportar dados' });
    }
  });

  /**
   * GET /api/health
   * Verifica a saúde da API
   */
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
}
