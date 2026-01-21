import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { authMiddleware } from '../core/middleware.js';
import { validate, LoginSchema, RegisterSchema, RefreshTokenSchema } from '../core/schemas.js';
import {
  hashPassword,
  comparePassword,
  generateJWT,
  generateRefreshToken,
  verifyRefreshToken,
} from '../core/auth.js';
import {
  getUserByEmail,
  createUser,
  updateLastLogin,
  createAuditLog,
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  createConsent,
} from '../core/database.js';
import { logInfo, logError } from '../core/logger.js';

const router = Router();

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = validate(RegisterSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { email, password, name } = validation.data;

    // Verificar se email já existe
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email já registrado' });
      return;
    }

    // Criar usuário
    const userId = nanoid();
    const passwordHash = await hashPassword(password);

    await createUser(userId, email, passwordHash, name);

    // Criar consentimento LGPD
    const consentId = nanoid();
    await createConsent(consentId, userId, true, true);

    // Log de auditoria
    const logId = nanoid();
    await createAuditLog(
      logId,
      userId,
      'USER_REGISTERED',
      'user',
      userId,
      req.ip || null,
      req.get('user-agent') || null
    );

    logInfo('Novo usuário registrado', { userId, email });

    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      userId,
    });
  } catch (error) {
    logError('Erro ao registrar usuário', error as Error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

/**
 * POST /api/auth/login
 * Faz login de um usuário
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = validate(LoginSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { email, password } = validation.data;

    // Buscar usuário
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Email ou senha inválidos' });
      return;
    }

    // Verificar senha
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Email ou senha inválidos' });
      return;
    }

    // Atualizar último login
    await updateLastLogin(user.id);

    // Gerar tokens
    const accessToken = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenValue = generateRefreshToken(user.id);
    const refreshTokenId = nanoid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await createRefreshToken(refreshTokenId, user.id, refreshTokenValue, expiresAt);

    // Log de auditoria
    const logId = nanoid();
    await createAuditLog(
      logId,
      user.id,
      'USER_LOGIN',
      'user',
      user.id,
      req.ip || null,
      req.get('user-agent') || null
    );

    logInfo('Usuário fez login', { userId: user.id, email });

    res.json({
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logError('Erro ao fazer login', error as Error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

/**
 * POST /api/auth/refresh
 * Renova o access token usando o refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validation = validate(RefreshTokenSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const { refreshToken } = validation.data;

    // Verificar refresh token
    const tokenRecord = await getRefreshToken(refreshToken);
    if (!tokenRecord) {
      res.status(401).json({ error: 'Refresh token inválido ou expirado' });
      return;
    }

    // Verificar payload do refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: 'Refresh token inválido' });
      return;
    }

    // Buscar usuário
    const user = await getUserByEmail(
      (await new Promise((resolve, reject) => {
        const sql = 'SELECT email FROM users WHERE id = ?';
        const db = require('../core/database.js').getDatabase();
        db.get(sql, [payload.userId], (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row?.email || null);
        });
      })) || ''
    );

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Gerar novo access token
    const newAccessToken = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logInfo('Token renovado', { userId: user.id });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    logError('Erro ao renovar token', error as Error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

/**
 * POST /api/auth/logout
 * Faz logout de um usuário
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    // Log de auditoria
    const logId = nanoid();
    await createAuditLog(
      logId,
      userId || null,
      'USER_LOGOUT',
      'user',
      userId || null,
      req.ip || null,
      req.get('user-agent') || null
    );

    logInfo('Usuário fez logout', { userId });

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    logError('Erro ao fazer logout', error as Error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

/**
 * GET /api/auth/me
 * Obtém informações do usuário autenticado
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    logError('Erro ao obter usuário', error as Error);
    res.status(500).json({ error: 'Erro ao obter usuário' });
  }
});

export default router;
