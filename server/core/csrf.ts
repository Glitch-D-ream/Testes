import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

/**
 * Configurar proteção CSRF
 * Usa tokens em cookies e headers
 */
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

/**
 * Middleware para retornar token CSRF ao cliente
 * Deve ser usado em rotas GET que renderizam formulários
 */
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.locals.csrfToken = req.csrfToken();
  next();
}

/**
 * Middleware para retornar token CSRF como JSON
 * Útil para APIs que precisam do token
 */
export function getCsrfToken(req: Request, res: Response): void {
  res.json({
    csrfToken: req.csrfToken(),
  });
}
