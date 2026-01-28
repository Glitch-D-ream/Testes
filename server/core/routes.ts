import { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { authMiddleware, optionalAuthMiddleware, requestLoggerMiddleware } from './middleware.ts';
import { csrfProtection, csrfTokenRoute } from './csrf.ts';
import { allQuery, runQuery, getQuery, createAuditLog } from './database.ts';
import { logInfo, logError } from './logger.ts';
import { HealthMonitor } from './health-monitor.ts';
import authRoutes from '../routes/auth.ts';
import analysisRoutes from '../routes/analysis.routes.ts';
import statisticsRoutes from '../routes/statistics.routes.ts';
import adminRoutes from '../routes/admin.routes.ts';
import telegramRoutes from '../routes/telegram.routes.ts';
import aiTestRoutes from '../routes/ai-test.routes.ts';
import searchRoutes from '../routes/search.routes.ts';
import auditRoutes from '../routes/audit.routes.ts';
import dossierRoutes from '../routes/dossier.routes.ts';

/**
 * Rate limiters
 */
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: Request) => (req as any).user ? 50 : 10,
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
  // Middleware global de logs
  app.use(requestLoggerMiddleware);
  
  // Proteção CSRF desabilitada temporariamente - frontend precisa ser ajustado para enviar o token
  // app.use(csrfProtection);
  
  // Rota para obter token CSRF
  app.get('/api/csrf-token', csrfTokenRoute);

  // Rotas de autenticação
  app.use('/api/auth', loginLimiter, authRoutes);

  // Rotas de análise
  app.use('/api/analyze', analysisLimiter, analysisRoutes);

  // Rotas de estatísticas
  app.use('/api/statistics', statisticsRoutes);

  // Rotas administrativas
  app.use('/api/admin', adminRoutes);

  // Rotas do Telegram (webhook)
  app.use('/api/telegram', telegramRoutes);

  // Rota de teste de IA
  app.use('/api/ai', aiTestRoutes);

  // Rotas de busca
  app.use('/api/search', searchRoutes);

  // Rotas de auditoria
  app.use('/api/audit', auditRoutes);

  // Rotas de dossiê
  app.use('/api/dossier', dossierRoutes);

  /**
   * GET /api/health
   * Verifica a saúde detalhada da API e serviços externos
   */
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const status = await HealthMonitor.getFullStatus();
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    } catch (err) {
      res.status(500).json({ status: 'error', message: (err as Error).message });
    }
  });
}
