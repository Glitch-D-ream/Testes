import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyJWT, JWTPayload } from './auth.js';

/**
 * Estende o tipo Request para incluir dados de usuário
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

/**
 * Middleware de autenticação obrigatória
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token não fornecido',
    });
    return;
  }

  const payload = verifyJWT(token);
  if (!payload) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado',
    });
    return;
  }

  req.user = payload;
  req.userId = payload.userId;
  next();
}

/**
 * Middleware de autenticação opcional
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyJWT(token);
    if (payload) {
      req.user = payload;
      req.userId = payload.userId;
    }
  }

  next();
}

/**
 * Middleware para verificar se o usuário é admin
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso restrito a administradores',
    });
    return;
  }

  next();
}

/**
 * Middleware para verificar se o usuário é analyst ou admin
 */
export function analystMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'analyst' && req.user.role !== 'admin')) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Acesso restrito a analistas',
    });
    return;
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
): void {
  console.error('[Error]', err);

  // Erro de validação
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
    return;
  }

  // Erro de autenticação
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
    return;
  }

  // Erro de autorização
  if (err.name === 'ForbiddenError') {
    res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
    return;
  }

  // Erro genérico
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Um erro interno ocorreu' 
      : err.message,
  });
}

/**
 * Middleware para logar requisições
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms - ${req.user?.userId || 'anonymous'}`
    );
  });

  next();
}
