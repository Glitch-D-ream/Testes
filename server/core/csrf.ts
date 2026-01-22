import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

/**
 * Middleware para proteção CSRF customizada
 * Utiliza o padrão Double Submit Cookie
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';

/**
 * Gera um novo token CSRF e define no cookie
 */
export function generateCsrfToken(req: Request, res: Response): string {
  const token = nanoid(32);
  
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Precisa ser acessível pelo frontend para enviar no header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  return token;
}

/**
 * Middleware para validar o token CSRF
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Métodos seguros não precisam de validação CSRF
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Token CSRF inválido ou ausente',
    });
    return;
  }

  next();
}

/**
 * Rota para obter um novo token CSRF (útil para o frontend inicializar)
 */
export function csrfTokenRoute(req: Request, res: Response): void {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
}
