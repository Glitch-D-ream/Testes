import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para adicionar headers de segurança HTTP
 * Implementa as melhores práticas de segurança web
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Strict-Transport-Security: força HTTPS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Content-Type-Options: previne MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options: previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection: proteção contra XSS (legacy)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy: controla informações de referência
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy: controla recursos do navegador
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // Content-Security-Policy: previne injeção de conteúdo
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  next();
}

/**
 * Middleware para adicionar headers de cache
 */
export function cacheHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Desabilitar cache para rotas de API
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Cache agressivo para assets estáticos
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  next();
}

/**
 * Middleware para remover headers desnecessários
 */
export function removeHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Remover header X-Powered-By que expõe tecnologia
  res.removeHeader('X-Powered-By');

  // Remover Server header (ou substituir por genérico)
  res.removeHeader('Server');

  next();
}
