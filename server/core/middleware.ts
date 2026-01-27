import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { extractTokenFromHeader, verifyJWT } from './auth.ts';

/**
 * Middleware de autenticação obrigatória
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token não fornecido',
    });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado',
    });
  }

  (req as any).user = payload;
  (req as any).userId = payload.userId;
  next();
}

/**
 * Middleware de autenticação opcional
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyJWT(token);
    if (payload) {
      (req as any).user = payload;
      (req as any).userId = payload.userId;
    }
  }

  next();
}

/**
 * Middleware para verificar se o usuário é admin
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso restrito a administradores',
    });
  }

  next();
}

/**
 * Middleware para verificar se o usuário é analyst ou admin
 */
export function analystMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'analyst' && user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso restrito a analistas',
    });
  }

  next();
}

/**
 * Middleware de tratamento de erros global
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Error]', err);

  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // Erro de autenticação
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }

  // Erro de autorização
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
  }

  // Erro genérico
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Um erro interno ocorreu' 
      : err.message,
  });
}

/**
 * Middleware para logar requisições
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms - ${(req as any).user?.userId || 'anonymous'}`
    );
  });

  next();
}

/**
 * Rate Limiter para o Scout (Passo 1.4)
 * 10 requisições por minuto por usuário/IP
 */
export const scoutRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // limite de 10 requisições
  message: {
    error: 'Too Many Requests',
    message: 'Limite de buscas atingido. Tente novamente em 1 minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).userId || req.ip;
  },
});

/**
 * Middleware de compressão de respostas
 */
export const compressionMiddleware = compression({
  level: 6,
  threshold: 1024, // Comprime apenas acima de 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
});
