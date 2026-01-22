import { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { authMiddleware, optionalAuthMiddleware, requestLoggerMiddleware } from './middleware.js';
import { csrfProtection, csrfTokenRoute } from './csrf.js';
import { allQuery, runQuery, getQuery, createAuditLog } from './database.js';
import { logInfo, logError } from './logger.js';
import authRoutes from '../routes/auth.js';
import analysisRoutes from '../routes/analysis.routes.js';
import statisticsRoutes from '../routes/statistics.routes.js';
import adminRoutes from '../routes/admin.routes.js';
import telegramRoutes from '../routes/telegram.routes.js';
import aiTestRoutes from '../routes/ai-test.routes.js';
import searchRoutes from '../routes/search.routes.js';

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
  
  /**
   * Middleware de Proteção CSRF
   * Aplicado seletivamente para evitar bloquear webhooks externos (Telegram)
   */
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Ignorar CSRF para:
    // 1. Rotas do Telegram (Webhooks)
    // 2. Métodos seguros (GET, HEAD, OPTIONS)
    if (req.path.startsWith('/api/telegram') || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Aplicar proteção CSRF para as demais rotas mutáveis
    csrfProtection(req, res, next);
  });
  
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

  /**
   * GET /api/health
   * Verifica a saúde da API
   */
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      database: !!process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
    });
  });
}
