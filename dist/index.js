var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/core/logger.ts
import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
function logInfo(message, meta) {
  logger.info(message, meta);
}
function logError(message, error, meta) {
  logger.error(message, {
    ...meta,
    error: error?.message,
    stack: error?.stack
  });
}
var __filename, __dirname, logsDir, logger, logger_default;
var init_logger = __esm({
  "server/core/logger.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    logsDir = path.join(__dirname, "../../logs");
    logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: "detector-promessa-vazia" },
      transports: [
        // Arquivo de erros
        new winston.transports.File({
          filename: path.join(logsDir, "error.log"),
          level: "error",
          maxsize: 10485760,
          // 10MB
          maxFiles: 5
        }),
        // Arquivo de logs gerais
        new winston.transports.File({
          filename: path.join(logsDir, "combined.log"),
          maxsize: 10485760,
          // 10MB
          maxFiles: 5
        })
      ]
    });
    if (process.env.NODE_ENV !== "production") {
      logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    }
    logger_default = logger;
  }
});

// server/core/database.ts
var database_exports = {};
__export(database_exports, {
  allQuery: () => allQuery,
  createAuditLog: () => createAuditLog,
  createConsent: () => createConsent,
  createRefreshToken: () => createRefreshToken,
  createUser: () => createUser,
  deleteRefreshToken: () => deleteRefreshToken,
  getConsent: () => getConsent,
  getQuery: () => getQuery,
  getRefreshToken: () => getRefreshToken,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  initializeDatabase: () => initializeDatabase,
  runQuery: () => runQuery,
  updateLastLogin: () => updateLastLogin
});
import sqlite3 from "sqlite3";
import pg from "pg";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
async function initializeDatabase() {
  if (isPostgres) {
    logInfo("[Database] Usando PostgreSQL (Supabase)");
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    try {
      const client = await pgPool.connect();
      logInfo("[Database] Conectado ao PostgreSQL com sucesso");
      client.release();
    } catch (err) {
      logError("[Database] Erro ao conectar ao PostgreSQL", err);
      throw err;
    }
  } else {
    logInfo("[Database] Usando SQLite local");
    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          logError("[Database] Erro ao conectar ao SQLite", err);
          reject(err);
        } else {
          logInfo("[Database] Conectado ao SQLite em: " + DB_PATH);
          createTables().then(resolve).catch(reject);
        }
      });
    });
  }
}
async function createTables() {
  if (isPostgres) return;
  if (!sqliteDb) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, name VARCHAR(255), role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME, is_active BOOLEAN DEFAULT 1)`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token VARCHAR(500) NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS analyses (id TEXT PRIMARY KEY, user_id TEXT, text TEXT NOT NULL, author TEXT, category TEXT, extracted_promises TEXT, probability_score REAL, methodology_notes TEXT, data_sources TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS promises (id TEXT PRIMARY KEY, analysis_id TEXT NOT NULL, promise_text TEXT NOT NULL, category TEXT, confidence_score REAL, extracted_entities TEXT, FOREIGN KEY(analysis_id) REFERENCES analyses(id))`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, action VARCHAR(255) NOT NULL, resource_type VARCHAR(100), resource_id TEXT, ip_address VARCHAR(45), user_agent TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data_processing BOOLEAN DEFAULT 0, privacy_policy BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS public_data_cache (id TEXT PRIMARY KEY, data_type TEXT NOT NULL, data_source TEXT NOT NULL, data_content TEXT NOT NULL, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP, expiry_date DATETIME)`);
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS analysis_history (id TEXT PRIMARY KEY, analysis_id TEXT NOT NULL, action TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(analysis_id) REFERENCES analyses(id))`, (err) => {
        if (err) logError("[Database] Erro ao criar tabelas", err);
        else {
          logInfo("[Database] Tabelas SQLite verificadas/criadas");
          resolve();
        }
      });
    });
  });
}
function runQuery(sql, params = []) {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes("?")) {
      pgSql = pgSql.replace("?", `$${counter++}`);
    }
    return pgPool.query(pgSql, params).then((res) => ({
      id: res.rows[0]?.id,
      changes: res.rowCount
    }));
  }
  if (!sqliteDb) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function getQuery(sql, params = []) {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes("?")) {
      pgSql = pgSql.replace("?", `$${counter++}`);
    }
    return pgPool.query(pgSql, params).then((res) => res.rows[0]);
  }
  if (!sqliteDb) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function allQuery(sql, params = []) {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes("?")) {
      pgSql = pgSql.replace("?", `$${counter++}`);
    }
    return pgPool.query(pgSql, params).then((res) => res.rows);
  }
  if (!sqliteDb) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
async function getUserById(userId) {
  return getQuery("SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?", [userId]);
}
async function getUserByEmail(email) {
  return getQuery("SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ?", [email]);
}
async function createUser(id, email, passwordHash, name) {
  await runQuery("INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)", [id, email, passwordHash, name, "user"]);
  return getUserById(id);
}
async function updateLastLogin(userId) {
  await runQuery("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
}
async function createAuditLog(id, userId, action, resourceType, resourceId, ipAddress, userAgent) {
  await runQuery("INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, userId, action, resourceType, resourceId, ipAddress, userAgent]);
}
async function createRefreshToken(id, userId, token, expiresAt) {
  await runQuery("INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [id, userId, token, expiresAt]);
}
async function getRefreshToken(token) {
  return getQuery("SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP", [token]);
}
async function deleteRefreshToken(token) {
  await runQuery("DELETE FROM refresh_tokens WHERE token = ?", [token]);
}
async function createConsent(id, userId, dataProcessing, privacyPolicy) {
  await runQuery("INSERT INTO consents (id, user_id, data_processing, privacy_policy) VALUES (?, ?, ?, ?)", [id, userId, dataProcessing ? 1 : 0, privacyPolicy ? 1 : 0]);
}
async function getConsent(userId) {
  return getQuery("SELECT id, user_id, data_processing, privacy_policy, created_at FROM consents WHERE user_id = ?", [userId]);
}
var __filename2, __dirname2, DB_PATH, DATABASE_URL, sqliteDb, pgPool, isPostgres;
var init_database = __esm({
  "server/core/database.ts"() {
    "use strict";
    init_logger();
    __filename2 = fileURLToPath2(import.meta.url);
    __dirname2 = path2.dirname(__filename2);
    DB_PATH = process.env.DATABASE_PATH || path2.join(__dirname2, "../../data/detector.db");
    DATABASE_URL = process.env.DATABASE_URL;
    sqliteDb = null;
    pgPool = null;
    isPostgres = !!DATABASE_URL;
  }
});

// server/index.ts
init_database();
import express from "express";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";

// server/core/routes.ts
import rateLimit2 from "express-rate-limit";
import { nanoid as nanoid5 } from "nanoid";

// server/core/auth.ts
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "detector-promessa-vazia-secret-key-change-in-production";
var JWT_EXPIRY = "24h";
var REFRESH_TOKEN_EXPIRY = "7d";
async function hashPassword(password) {
  const saltRounds = 10;
  return bcryptjs.hash(password, saltRounds);
}
async function comparePassword(password, hash) {
  return bcryptjs.compare(password, hash);
}
function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY
  });
}
function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}
function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY
  });
}
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

// server/core/middleware.ts
function authMiddleware(req, res, next) {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Token n\xE3o fornecido"
    });
    return;
  }
  const payload = verifyJWT(token);
  if (!payload) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Token inv\xE1lido ou expirado"
    });
    return;
  }
  req.user = payload;
  req.userId = payload.userId;
  next();
}
function optionalAuthMiddleware(req, res, next) {
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
function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms - ${req.user?.userId || "anonymous"}`
    );
  });
  next();
}

// server/core/csrf.ts
import { nanoid } from "nanoid";
var CSRF_COOKIE_NAME = "XSRF-TOKEN";
var CSRF_HEADER_NAME = "x-xsrf-token";
function generateCsrfToken(req, res) {
  const token = nanoid(32);
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    // Precisa ser acessível pelo frontend para enviar no header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  });
  return token;
}
function csrfProtection(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }
  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE_NAME] : null;
  const headerToken = req.headers[CSRF_HEADER_NAME];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      error: "Forbidden",
      message: "Token CSRF inv\xE1lido ou ausente"
    });
    return;
  }
  next();
}
function csrfTokenRoute(req, res) {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
}

// server/core/routes.ts
init_database();
init_logger();

// server/routes/auth.ts
import { Router } from "express";
import { nanoid as nanoid2 } from "nanoid";

// server/core/schemas.ts
import { z } from "zod";
var AnalysisSchema = z.object({
  text: z.string().min(10, "Texto deve ter no m\xEDnimo 10 caracteres").max(1e4, "Texto n\xE3o pode exceder 10000 caracteres"),
  author: z.string().max(255, "Nome do autor n\xE3o pode exceder 255 caracteres").optional(),
  category: z.enum([
    "EDUCATION",
    "HEALTH",
    "INFRASTRUCTURE",
    "ECONOMY",
    "SECURITY",
    "ENVIRONMENT",
    "EMPLOYMENT",
    "SOCIAL",
    "TECHNOLOGY",
    "OTHER"
  ]).optional()
});
var RegisterSchema = z.object({
  email: z.string().email("Email inv\xE1lido").max(255, "Email n\xE3o pode exceder 255 caracteres"),
  password: z.string().min(8, "Senha deve ter no m\xEDnimo 8 caracteres").regex(/[A-Z]/, "Senha deve conter pelo menos uma letra mai\xFAscula").regex(/[0-9]/, "Senha deve conter pelo menos um n\xFAmero"),
  name: z.string().min(2, "Nome deve ter no m\xEDnimo 2 caracteres").max(255, "Nome n\xE3o pode exceder 255 caracteres")
});
var LoginSchema = z.object({
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(1, "Senha \xE9 obrigat\xF3ria")
});
var RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token \xE9 obrigat\xF3rio")
});
var ConsentSchema = z.object({
  dataProcessing: z.boolean().refine((val) => val === true, "Voc\xEA deve consentir com o processamento de dados"),
  privacyPolicy: z.boolean().refine((val) => val === true, "Voc\xEA deve aceitar a pol\xEDtica de privacidade")
});
function validate(schema, data) {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return { success: false, error: messages };
    }
    return { success: false, error: "Erro de valida\xE7\xE3o desconhecido" };
  }
}

// server/routes/auth.ts
init_database();
init_logger();
var router = Router();
router.post("/register", async (req, res) => {
  try {
    const validation = validate(RegisterSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const { email, password, name } = validation.data;
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: "Email j\xE1 registrado" });
      return;
    }
    const userId = nanoid2();
    const passwordHash = await hashPassword(password);
    await createUser(userId, email, passwordHash, name);
    const consentId = nanoid2();
    await createConsent(consentId, userId, true, true);
    const logId = nanoid2();
    await createAuditLog(
      logId,
      userId,
      "USER_REGISTERED",
      "user",
      userId,
      req.ip || null,
      req.get("user-agent") || null
    );
    logInfo("Novo usu\xE1rio registrado", { userId, email });
    res.status(201).json({
      message: "Usu\xE1rio registrado com sucesso",
      userId
    });
  } catch (error) {
    logError("Erro ao registrar usu\xE1rio", error);
    res.status(500).json({ error: "Erro ao registrar usu\xE1rio" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const validation = validate(LoginSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const { email, password } = validation.data;
    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Email ou senha inv\xE1lidos" });
      return;
    }
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Email ou senha inv\xE1lidos" });
      return;
    }
    await updateLastLogin(user.id);
    const accessToken = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const refreshTokenValue = generateRefreshToken(user.id);
    const refreshTokenId = nanoid2();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    await createRefreshToken(refreshTokenId, user.id, refreshTokenValue, expiresAt);
    const logId = nanoid2();
    await createAuditLog(
      logId,
      user.id,
      "USER_LOGIN",
      "user",
      user.id,
      req.ip || null,
      req.get("user-agent") || null
    );
    logInfo("Usu\xE1rio fez login", { userId: user.id, email });
    res.json({
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logError("Erro ao fazer login", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});
router.post("/refresh", async (req, res) => {
  try {
    const validation = validate(RefreshTokenSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }
    const { refreshToken } = validation.data;
    const tokenRecord = await getRefreshToken(refreshToken);
    if (!tokenRecord) {
      res.status(401).json({ error: "Refresh token inv\xE1lido ou expirado" });
      return;
    }
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: "Refresh token inv\xE1lido" });
      return;
    }
    const user = await getUserByEmail(
      await new Promise((resolve, reject) => {
        const sql = "SELECT email FROM users WHERE id = ?";
        const db = (init_database(), __toCommonJS(database_exports)).getDatabase();
        db.get(sql, [payload.userId], (err, row) => {
          if (err) reject(err);
          else resolve(row?.email || null);
        });
      }) || ""
    );
    if (!user) {
      res.status(401).json({ error: "Usu\xE1rio n\xE3o encontrado" });
      return;
    }
    const newAccessToken = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    logInfo("Token renovado", { userId: user.id });
    res.json({
      accessToken: newAccessToken
    });
  } catch (error) {
    logError("Erro ao renovar token", error);
    res.status(500).json({ error: "Erro ao renovar token" });
  }
});
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const logId = nanoid2();
    await createAuditLog(
      logId,
      userId || null,
      "USER_LOGOUT",
      "user",
      userId || null,
      req.ip || null,
      req.get("user-agent") || null
    );
    logInfo("Usu\xE1rio fez logout", { userId });
    res.json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    logError("Erro ao fazer logout", error);
    res.status(500).json({ error: "Erro ao fazer logout" });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    logError("Erro ao obter usu\xE1rio", error);
    res.status(500).json({ error: "Erro ao obter usu\xE1rio" });
  }
});
var auth_default = router;

// server/routes/analysis.routes.ts
import { Router as Router2 } from "express";

// server/services/analysis.service.ts
init_database();
import { nanoid as nanoid3 } from "nanoid";

// server/modules/nlp.ts
var PROMISE_VERBS = [
  "vou",
  "vamos",
  "iremos",
  "irei",
  "prometo",
  "prometemos",
  "prometerem",
  "farei",
  "faremos",
  "far\xE3o",
  "construirei",
  "construiremos",
  "construir\xE3o",
  "implementarei",
  "implementaremos",
  "implementar\xE3o",
  "criarei",
  "criaremos",
  "criar\xE3o",
  "aumentarei",
  "aumentaremos",
  "aumentar\xE3o",
  "reduzirei",
  "reduziremos",
  "reduzir\xE3o",
  "melhorarei",
  "melhoraremos",
  "melhorar\xE3o",
  "investirei",
  "investiremos",
  "investir\xE3o",
  "garantirei",
  "garantiremos",
  "garantir\xE3o",
  "assegurarei",
  "asseguraremos",
  "assegurar\xE3o",
  "realizarei",
  "realizaremos",
  "realizar\xE3o",
  "executarei",
  "executaremos",
  "executar\xE3o",
  "entreguei",
  "entregamos",
  "entregarei",
  "entregaremos",
  "desenvolvi",
  "desenvolvemos",
  "desenvolverei",
  "desenvolveremos",
  "ampliarei",
  "ampliaremos",
  "ampliar\xE3o",
  "expandirei",
  "expandiremos",
  "expandir\xE3o",
  "modernizarei",
  "modernizaremos",
  "modernizar\xE3o",
  "reformarei",
  "reformaremos",
  "reformar\xE3o",
  "restaurarei",
  "restauraremos",
  "restaurar\xE3o",
  "recuperarei",
  "recuperaremos",
  "recuperar\xE3o",
  "revitalizarei",
  "revitalizaremos",
  "revitalizar\xE3o"
];
var PROMISE_CATEGORIES = {
  INFRASTRUCTURE: ["construir", "obra", "estrada", "ponte", "rodovia", "ferrovia", "aeroporto", "porto", "infraestrutura"],
  EDUCATION: ["escola", "educa\xE7\xE3o", "ensino", "universidade", "bolsa", "professor", "aluno", "aprendizado"],
  HEALTH: ["sa\xFAde", "hospital", "m\xE9dico", "medicamento", "ambul\xE2ncia", "cl\xEDnica", "enfermeiro", "atendimento"],
  EMPLOYMENT: ["emprego", "trabalho", "desemprego", "renda", "sal\xE1rio", "profiss\xE3o", "ocupa\xE7\xE3o", "contrata\xE7\xE3o"],
  SECURITY: ["seguran\xE7a", "pol\xEDcia", "crime", "viol\xEAncia", "patrulha", "delegacia", "pres\xEDdio", "criminalidade"],
  ENVIRONMENT: ["ambiente", "sustentabilidade", "verde", "parque", "floresta", "polui\xE7\xE3o", "reciclagem", "energia"],
  SOCIAL: ["social", "pobreza", "assist\xEAncia", "benef\xEDcio", "aux\xEDlio", "vulner\xE1vel", "comunidade", "inclus\xE3o"],
  ECONOMY: ["economia", "neg\xF3cio", "empresa", "investimento", "crescimento", "PIB", "renda", "desenvolvimento"],
  AGRICULTURE: ["agricultura", "fazenda", "agropecu\xE1ria", "planta\xE7\xE3o", "colheita", "subs\xEDdio", "produtor"],
  CULTURE: ["cultura", "arte", "m\xFAsica", "cinema", "museu", "patrim\xF4nio", "evento", "festival"]
};
function extractPromises(text) {
  const promises = [];
  const sentences = splitSentences(text);
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    for (const verb of PROMISE_VERBS) {
      if (sentenceLower.includes(verb)) {
        const promise = analyzeSentence(sentence, verb);
        if (promise) {
          promises.push(promise);
        }
        break;
      }
    }
  }
  return promises;
}
function splitSentences(text) {
  return text.split(/[.!?;]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}
function analyzeSentence(sentence, verb) {
  const sentenceLower = sentence.toLowerCase();
  const numbers = extractNumbers(sentence);
  const nouns = extractNouns(sentence);
  let category = "GERAL";
  for (const [cat, keywords] of Object.entries(PROMISE_CATEGORIES)) {
    if (keywords.some((kw) => sentenceLower.includes(kw))) {
      category = cat;
      break;
    }
  }
  let confidence = 0.5;
  if (numbers.length > 0) confidence += 0.2;
  if (/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i.test(sentence)) {
    confidence += 0.1;
  }
  if (/\b(mil|milhão|bilhão|centenas|dezenas|todas|todos|100%)\b/i.test(sentence)) {
    confidence += 0.1;
  }
  confidence = Math.min(confidence, 1);
  return {
    text: sentence.trim(),
    confidence,
    category,
    entities: {
      verbs: [verb],
      nouns,
      numbers
    }
  };
}
function extractNumbers(text) {
  const numberPattern = /\b\d+(?:[.,]\d+)?\s*(?:mil|milhão|bilhão|%|reais|R\$)?\b/gi;
  const matches = text.match(numberPattern);
  return matches || [];
}
function extractNouns(sentence) {
  const nounPattern = /\b([A-Z][a-záéíóúâêôãõç]*|(?:de|em|para|por|com)\s+([a-záéíóúâêôãõç]+))\b/g;
  const matches = [];
  let match;
  while ((match = nounPattern.exec(sentence)) !== null) {
    matches.push(match[1] || match[2]);
  }
  return [...new Set(matches)];
}

// server/modules/probability.ts
function calculateProbability(promises, author, category) {
  if (promises.length === 0) return 0;
  let totalScore = 0;
  for (const promise of promises) {
    const factors = calculateFactors(promise, author, category);
    const score = aggregateFactors(factors);
    totalScore += score;
  }
  return Math.round(totalScore / promises.length * 100) / 100;
}
function calculateFactors(promise, author, category) {
  return {
    promiseSpecificity: calculateSpecificity(promise),
    historicalCompliance: calculateHistoricalCompliance(author, category),
    budgetaryFeasibility: calculateBudgetaryFeasibility(promise, category),
    timelineFeasibility: calculateTimelineFeasibility(promise),
    authorTrack: calculateAuthorTrack(author)
  };
}
function calculateSpecificity(promise) {
  let score = 0.3;
  if (promise.entities?.numbers && promise.entities.numbers.length > 0) {
    score += 0.2;
  }
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i)) {
    score += 0.2;
  }
  if (promise.entities?.verbs && promise.entities.verbs.length > 0) {
    score += 0.1;
  }
  if (promise.text.length > 100) {
    score += 0.1;
  }
  return Math.min(score, 1);
}
function calculateHistoricalCompliance(author, category) {
  const categoryCompliance = {
    INFRASTRUCTURE: 0.35,
    // Obras públicas têm baixa taxa de cumprimento
    EDUCATION: 0.45,
    HEALTH: 0.4,
    EMPLOYMENT: 0.3,
    // Promessas de emprego raramente são cumpridas
    SECURITY: 0.25,
    ENVIRONMENT: 0.2,
    // Promessas ambientais têm baixa taxa
    SOCIAL: 0.35,
    ECONOMY: 0.3,
    AGRICULTURE: 0.4,
    CULTURE: 0.5
  };
  return categoryCompliance[category || "GERAL"] || 0.35;
}
function calculateBudgetaryFeasibility(promise, category) {
  let score = 0.5;
  if (promise.entities?.numbers && promise.entities.numbers.length > 0) {
    const numbers = promise.entities.numbers.map(
      (n) => parseInt(n.replace(/[^\d]/g, "")) || 0
    );
    const maxNumber = Math.max(...numbers);
    if (promise.text.match(/bilhão/i)) {
      score -= 0.2;
    } else if (promise.text.match(/milhão/i)) {
      score -= 0.1;
    } else if (maxNumber < 1e6) {
      score += 0.2;
    }
  }
  const budgetaryCategories = {
    INFRASTRUCTURE: 0.4,
    EDUCATION: 0.6,
    HEALTH: 0.5,
    EMPLOYMENT: 0.3,
    SECURITY: 0.5,
    ENVIRONMENT: 0.3,
    SOCIAL: 0.4,
    ECONOMY: 0.5,
    AGRICULTURE: 0.4,
    CULTURE: 0.3
  };
  score = budgetaryCategories[category || "GERAL"] || 0.5;
  return Math.min(Math.max(score, 0), 1);
}
function calculateTimelineFeasibility(promise) {
  let score = 0.6;
  const timelineMatch = promise.text.match(/(\d+)\s*(dias?|semanas?|meses?|anos?)/i);
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1]);
    const unit = timelineMatch[2].toLowerCase();
    let days = 0;
    if (unit.includes("dia")) days = value;
    else if (unit.includes("semana")) days = value * 7;
    else if (unit.includes("m\xEAs")) days = value * 30;
    else if (unit.includes("ano")) days = value * 365;
    if (days < 30) {
      score -= 0.2;
    } else if (days < 90) {
      score -= 0.1;
    } else if (days > 1825) {
      score -= 0.15;
    } else {
      score += 0.1;
    }
  }
  return Math.min(Math.max(score, 0), 1);
}
function calculateAuthorTrack(author) {
  if (!author) return 0.5;
  return 0.4;
}
function aggregateFactors(factors) {
  const weights = {
    promiseSpecificity: 0.25,
    historicalCompliance: 0.25,
    budgetaryFeasibility: 0.2,
    timelineFeasibility: 0.15,
    authorTrack: 0.15
  };
  const score = factors.promiseSpecificity * weights.promiseSpecificity + factors.historicalCompliance * weights.historicalCompliance + factors.budgetaryFeasibility * weights.budgetaryFeasibility + factors.timelineFeasibility * weights.timelineFeasibility + factors.authorTrack * weights.authorTrack;
  return score;
}

// server/services/ai.service.ts
init_logger();
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
var genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
var groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
var deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || ""
});
var AIService = class {
  promptTemplate(text) {
    return `Voc\xEA \xE9 um analista pol\xEDtico especializado em fact-checking e an\xE1lise de promessas. 
    Analise o texto fornecido e extraia todas as promessas pol\xEDticas.
    Para cada promessa, identifique:
    1. O texto exato da promessa.
    2. A categoria (Sa\xFAde, Educa\xE7\xE3o, Infraestrutura, Economia, etc).
    3. Score de confian\xE7a (0-1) de que isso \xE9 realmente uma promessa.
    4. Se \xE9 uma promessa negativa (ex: "n\xE3o vou fazer").
    5. Se \xE9 uma promessa condicional (ex: "se eu ganhar").
    6. Uma breve explica\xE7\xE3o do racioc\xEDnio.
    
    Tamb\xE9m forne\xE7a um sentimento geral do texto e um score de credibilidade inicial (0-100).
    Responda estritamente em formato JSON seguindo esta estrutura:
    {
      "promises": [
        {
          "text": "string",
          "category": "string",
          "confidence": number,
          "negated": boolean,
          "conditional": boolean,
          "reasoning": "string"
        }
      ],
      "overallSentiment": "string",
      "credibilityScore": number
    }
    
    Texto para an\xE1lise:
    ${text}`;
  }
  /**
   * Tenta análise com Gemini (Provedor Primário - Melhor Português)
   */
  async analyzeWithGemini(text) {
    logInfo("Tentando an\xE1lise com Gemini 1.5 Flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    const result = await model.generateContent(this.promptTemplate(text));
    const response = await result.response;
    return JSON.parse(response.text());
  }
  /**
   * Tenta análise com DeepSeek (Provedor de Alta Qualidade e Baixo Custo)
   */
  async analyzeWithDeepSeek(text) {
    logInfo("Tentando an\xE1lise com DeepSeek-V3.2...");
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: this.promptTemplate(text) }],
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia do DeepSeek");
    return JSON.parse(content);
  }
  /**
   * Tenta análise com Groq/Llama 3 (Provedor de Fallback Ultra-rápido)
   */
  async analyzeWithGroq(text) {
    logInfo("Tentando an\xE1lise com Groq (Llama 3.3 70B)...");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: this.promptTemplate(text) }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia do Groq");
    return JSON.parse(content);
  }
  /**
   * Método principal com lógica de Fallback entre provedores gratuitos
   */
  async analyzeText(text) {
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.analyzeWithGemini(text);
      } catch (error) {
        logError("Falha no Gemini, tentando DeepSeek...", error);
      }
    }
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        return await this.analyzeWithDeepSeek(text);
      } catch (error) {
        logError("Falha no DeepSeek, tentando Groq...", error);
      }
    }
    if (process.env.GROQ_API_KEY) {
      try {
        return await this.analyzeWithGroq(text);
      } catch (error) {
        logError("Falha no Groq...", error);
      }
    }
    throw new Error("Nenhum provedor de IA gratuito dispon\xEDvel ou configurado corretamente.");
  }
};
var aiService = new AIService();

// server/services/analysis.service.ts
var AnalysisService = class {
  async createAnalysis(userId, text, author, category) {
    let promises;
    let aiAnalysis = null;
    try {
      aiAnalysis = await aiService.analyzeText(text);
      promises = aiAnalysis.promises.map((p) => ({
        text: p.text,
        confidence: p.confidence,
        category: p.category,
        negated: p.negated,
        conditional: p.conditional,
        reasoning: p.reasoning
      }));
    } catch (error) {
      console.error("Fallback para NLP local devido a erro na IA:", error);
      promises = extractPromises(text);
    }
    const analysisId = nanoid3();
    const probabilityScore = calculateProbability(promises, category);
    await runQuery(
      `INSERT INTO analyses (id, user_id, text, author, category, extracted_promises, probability_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [analysisId, userId, text, author, category, JSON.stringify(promises), probabilityScore]
    );
    for (const promise of promises) {
      const promiseId = nanoid3();
      await runQuery(
        `INSERT INTO promises (id, analysis_id, promise_text, category, confidence_score)
         VALUES (?, ?, ?, ?, ?)`,
        [promiseId, analysisId, promise.text, promise.category, promise.confidence]
      );
    }
    return {
      id: analysisId,
      probabilityScore,
      promisesCount: promises.length,
      promises
    };
  }
  async getAnalysisById(id) {
    const analysis = await getQuery(
      "SELECT * FROM analyses WHERE id = ?",
      [id]
    );
    if (!analysis) return null;
    const promises = await allQuery(
      "SELECT * FROM promises WHERE analysis_id = ?",
      [id]
    );
    return {
      ...analysis,
      promises,
      extracted_promises: JSON.parse(analysis.extracted_promises || "[]")
    };
  }
  async listAnalyses(limit = 50, offset = 0) {
    const analyses = await allQuery(
      `SELECT id, author, category, probability_score, created_at
       FROM analyses
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const total = await getQuery("SELECT COUNT(*) as count FROM analyses");
    return {
      analyses,
      total: total.count
    };
  }
};
var analysisService = new AnalysisService();

// server/services/export.service.ts
import { jsPDF } from "jspdf";
import "jspdf-autotable";
var ExportService = class {
  analysisService = new AnalysisService();
  async generateAnalysisPDF(analysisId) {
    const analysis = await this.analysisService.getAnalysisById(analysisId);
    if (!analysis) throw new Error("An\xE1lise n\xE3o encontrada");
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Relat\xF3rio de An\xE1lise de Promessa", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`ID: ${analysis.id}`, 20, 35);
    doc.text(`Autor: ${analysis.author || "N\xE3o informado"}`, 20, 42);
    doc.text(`Data: ${new Date(analysis.created_at).toLocaleDateString("pt-BR")}`, 20, 49);
    doc.text(`Score de Probabilidade: ${(analysis.probability_score * 100).toFixed(1)}%`, 20, 56);
    doc.setFontSize(14);
    doc.text("Texto Analisado:", 20, 70);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(analysis.text, 170);
    doc.text(splitText, 20, 77);
    const tableData = analysis.promises.map((p) => [
      p.promise_text,
      p.category || "Geral",
      `${(p.confidence_score * 100).toFixed(0)}%`,
      p.negated ? "Sim" : "N\xE3o",
      p.conditional ? "Sim" : "N\xE3o"
    ]);
    doc.autoTable({
      startY: 100,
      head: [["Promessa", "Categoria", "Confian\xE7a", "Negada", "Condicional"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] }
    });
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(12);
    doc.text("Metodologia:", 20, finalY + 20);
    doc.setFontSize(9);
    const methodology = "Esta an\xE1lise utiliza Processamento de Linguagem Natural e Intelig\xEAncia Artificial para identificar padr\xF5es lingu\xEDsticos, compromissos e viabilidade or\xE7ament\xE1ria baseada em dados p\xFAblicos.";
    doc.text(doc.splitTextToSize(methodology, 170), 20, finalY + 27);
    return Buffer.from(doc.output("arraybuffer"));
  }
};
var exportService = new ExportService();

// server/controllers/analysis.controller.ts
init_logger();
init_database();
import { nanoid as nanoid4 } from "nanoid";
var AnalysisController = class {
  async create(req, res) {
    try {
      const validation = validate(AnalysisSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const { text, author, category } = validation.data;
      const userId = req.userId || null;
      const result = await analysisService.createAnalysis(userId, text, author, category);
      await createAuditLog(
        nanoid4(),
        userId,
        "ANALYSIS_CREATED",
        "analysis",
        result.id,
        req.ip || null,
        req.get("user-agent") || null
      );
      logInfo("An\xE1lise criada", { analysisId: result.id, userId, promisesCount: result.promisesCount });
      res.status(201).json(result);
    } catch (error) {
      logError("Erro ao criar an\xE1lise", error);
      res.status(500).json({ error: "Erro ao criar an\xE1lise" });
    }
  }
  async getById(req, res) {
    try {
      const { id } = req.params;
      const analysis = await analysisService.getAnalysisById(id);
      if (!analysis) {
        return res.status(404).json({ error: "An\xE1lise n\xE3o encontrada" });
      }
      res.json(analysis);
    } catch (error) {
      logError("Erro ao obter an\xE1lise", error);
      res.status(500).json({ error: "Erro ao obter an\xE1lise" });
    }
  }
  async list(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;
      const result = await analysisService.listAnalyses(limit, offset);
      res.json({
        ...result,
        limit,
        offset
      });
    } catch (error) {
      logError("Erro ao listar an\xE1lises", error);
      res.status(500).json({ error: "Erro ao listar an\xE1lises" });
    }
  }
  async exportPDF(req, res) {
    try {
      const { id } = req.params;
      const pdfBuffer = await exportService.generateAnalysisPDF(id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="analise-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logError("Erro ao exportar PDF", error);
      res.status(500).json({ error: "Erro ao gerar relat\xF3rio PDF" });
    }
  }
};
var analysisController = new AnalysisController();

// server/routes/analysis.routes.ts
import rateLimit from "express-rate-limit";
var router2 = Router2();
var analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  // 1 hora
  max: (req) => {
    return req.user ? 50 : 10;
  },
  message: "Muitas an\xE1lises. Tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false
});
router2.post("/", optionalAuthMiddleware, analysisLimiter, analysisController.create);
router2.get("/:id", optionalAuthMiddleware, analysisController.getById);
router2.get("/:id/pdf", optionalAuthMiddleware, analysisController.exportPDF);
router2.get("/", optionalAuthMiddleware, analysisController.list);
var analysis_routes_default = router2;

// server/routes/statistics.routes.ts
import { Router as Router3 } from "express";

// server/controllers/statistics.controller.ts
init_database();
init_logger();
var StatisticsController = class {
  async getGlobalStats(req, res) {
    try {
      const totalAnalysesResult = await getQuery("SELECT COUNT(*) as count FROM analyses");
      const totalAnalyses = totalAnalysesResult?.count || 0;
      const totalPromisesResult = await getQuery("SELECT COUNT(*) as count FROM promises");
      const totalPromises = totalPromisesResult?.count || 0;
      const avgViabilityResult = await getQuery(
        "SELECT AVG(probability_score) as avg FROM analyses"
      );
      const averageViability = avgViabilityResult?.avg || 0;
      const categoriesResult = await allQuery(
        "SELECT category, COUNT(*) as count FROM promises GROUP BY category"
      );
      const categoriesDistribution = {};
      categoriesResult.forEach((row) => {
        categoriesDistribution[row.category || "Geral"] = row.count;
      });
      const viabilityResult = await allQuery(
        `SELECT p.category, AVG(a.probability_score) as avg_viability
         FROM promises p
         JOIN analyses a ON p.analysis_id = a.id
         GROUP BY p.category`
      );
      const viabilityByCategory = {};
      viabilityResult.forEach((row) => {
        viabilityByCategory[row.category || "Geral"] = row.avg_viability || 0;
      });
      const trendsResult = await allQuery(
        `SELECT 
           DATE(created_at) as date,
           AVG(probability_score) as viability,
           COUNT(*) as count
         FROM analyses
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );
      const trends = trendsResult.map((row) => ({
        date: row.date,
        viability: (row.viability || 0) * 100,
        count: row.count
      }));
      res.json({
        totalAnalyses,
        totalPromises,
        averageViability,
        categoriesDistribution,
        viabilityByCategory,
        trends
      });
    } catch (error) {
      logError("Erro ao buscar estat\xEDsticas globais", error);
      res.status(500).json({ error: "Erro ao buscar estat\xEDsticas" });
    }
  }
};
var statisticsController = new StatisticsController();

// server/routes/statistics.routes.ts
var router3 = Router3();
router3.get("/", statisticsController.getGlobalStats);
var statistics_routes_default = router3;

// server/routes/admin.routes.ts
import { Router as Router4 } from "express";

// server/jobs/sync-public-data.ts
init_logger();

// server/integrations/siconfi.ts
init_logger();
import axios from "axios";
var SICONFI_API_BASE = "https://apidatalake.tesouro.gov.br/api/siconfi";
async function getBudgetData(category, year, sphere = "FEDERAL") {
  try {
    logger_default.info(`[SICONFI] Buscando dados or\xE7ament\xE1rios: ${category} (${year})`);
    const response = await axios.get(`${SICONFI_API_BASE}/orcamento`, {
      params: {
        categoria: category,
        ano: year,
        esfera: sphere
      },
      timeout: 1e4
    });
    if (!response.data || response.data.length === 0) {
      logger_default.warn(`[SICONFI] Nenhum dado encontrado para ${category}`);
      return null;
    }
    const data = response.data[0];
    return {
      year,
      sphere,
      category,
      budgeted: parseFloat(data.valor_orcado || 0),
      executed: parseFloat(data.valor_executado || 0),
      percentage: calculateExecutionRate(
        parseFloat(data.valor_orcado || 0),
        parseFloat(data.valor_executado || 0)
      ),
      lastUpdated: /* @__PURE__ */ new Date()
    };
  } catch (error) {
    logger_default.error(`[SICONFI] Erro ao buscar dados: ${error}`);
    return null;
  }
}
function calculateExecutionRate(budgeted, executed) {
  if (budgeted === 0) return 0;
  return Math.min(executed / budgeted * 100, 100);
}
async function syncSiconfiData(categories) {
  try {
    logger_default.info("[SICONFI] Iniciando sincroniza\xE7\xE3o de dados");
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    for (const category of categories) {
      for (let year = currentYear - 3; year <= currentYear; year++) {
        for (const sphere of ["FEDERAL", "STATE", "MUNICIPAL"]) {
          const data = await getBudgetData(category, year, sphere);
          if (data) {
            logger_default.debug(`[SICONFI] Sincronizado: ${category} ${year} ${sphere}`);
          }
        }
      }
    }
    logger_default.info("[SICONFI] Sincroniza\xE7\xE3o conclu\xEDda");
  } catch (error) {
    logger_default.error(`[SICONFI] Erro durante sincroniza\xE7\xE3o: ${error}`);
  }
}

// server/integrations/portal-transparencia.ts
init_logger();
import axios2 from "axios";
var PORTAL_API_BASE = "https://www.portaltransparencia.gov.br/api-de-dados";
async function getExpenses(category, startDate, endDate, limit = 100) {
  try {
    logger_default.info(`[Portal Transpar\xEAncia] Buscando despesas: ${category}`);
    const response = await axios2.get(`${PORTAL_API_BASE}/despesas`, {
      params: {
        descricao: category,
        dataInicio: startDate.toISOString().split("T")[0],
        dataFim: endDate.toISOString().split("T")[0],
        pagina: 1,
        tamanhoPagina: limit
      },
      timeout: 1e4
    });
    if (!response.data || !response.data.dados) {
      logger_default.warn(`[Portal Transpar\xEAncia] Nenhuma despesa encontrada`);
      return [];
    }
    return response.data.dados.map((item) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      beneficiary: item.beneficiario,
      category: item.categoria,
      source: item.fonte
    }));
  } catch (error) {
    logger_default.error(`[Portal Transpar\xEAncia] Erro ao buscar despesas: ${error}`);
    return [];
  }
}
async function getTransferences(state, startDate, endDate, limit = 100) {
  try {
    logger_default.info(`[Portal Transpar\xEAncia] Buscando transfer\xEAncias para ${state}`);
    const response = await axios2.get(`${PORTAL_API_BASE}/transferencias`, {
      params: {
        uf: state,
        dataInicio: startDate.toISOString().split("T")[0],
        dataFim: endDate.toISOString().split("T")[0],
        pagina: 1,
        tamanhoPagina: limit
      },
      timeout: 1e4
    });
    if (!response.data || !response.data.dados) {
      logger_default.warn(`[Portal Transpar\xEAncia] Nenhuma transfer\xEAncia encontrada`);
      return [];
    }
    return response.data.dados.map((item) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      recipient: item.beneficiario,
      state: item.uf,
      category: item.categoria
    }));
  } catch (error) {
    logger_default.error(`[Portal Transpar\xEAncia] Erro ao buscar transfer\xEAncias: ${error}`);
    return [];
  }
}
async function syncPortalData(categories, states) {
  try {
    logger_default.info("[Portal Transpar\xEAncia] Iniciando sincroniza\xE7\xE3o de dados");
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const startDate = new Date(currentYear - 3, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    for (const category of categories) {
      const expenses = await getExpenses(category, startDate, endDate, 500);
      logger_default.debug(`[Portal Transpar\xEAncia] Sincronizadas ${expenses.length} despesas de ${category}`);
    }
    for (const state of states) {
      const transferences = await getTransferences(state, startDate, endDate, 500);
      logger_default.debug(
        `[Portal Transpar\xEAncia] Sincronizadas ${transferences.length} transfer\xEAncias para ${state}`
      );
    }
    logger_default.info("[Portal Transpar\xEAncia] Sincroniza\xE7\xE3o conclu\xEDda");
  } catch (error) {
    logger_default.error(`[Portal Transpar\xEAncia] Erro durante sincroniza\xE7\xE3o: ${error}`);
  }
}

// server/integrations/tse.ts
init_logger();
import axios3 from "axios";
var TSE_API_BASE = "https://www.tse.jus.br/eleitor/api";
async function getCandidateInfo(candidateName, state) {
  try {
    logger_default.info(`[TSE] Buscando candidato: ${candidateName} (${state})`);
    const response = await axios3.get(`${TSE_API_BASE}/candidatos`, {
      params: {
        nome: candidateName,
        uf: state
      },
      timeout: 1e4
    });
    if (!response.data || response.data.length === 0) {
      logger_default.warn(`[TSE] Candidato n\xE3o encontrado: ${candidateName}`);
      return null;
    }
    const data = response.data[0];
    return {
      id: data.id,
      name: data.nome,
      party: data.partido,
      position: data.cargo,
      state: data.uf,
      city: data.municipio,
      electionYear: parseInt(data.ano_eleicao),
      votes: parseInt(data.votos || 0),
      elected: data.eleito === "S"
    };
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar candidato: ${error}`);
    return null;
  }
}
async function getCandidatePromiseHistory(candidateId, candidateName) {
  try {
    logger_default.info(`[TSE] Buscando hist\xF3rico de promessas: ${candidateName}`);
    const response = await axios3.get(`${TSE_API_BASE}/promessas`, {
      params: {
        candidato_id: candidateId
      },
      timeout: 1e4
    });
    if (!response.data || response.data.length === 0) {
      logger_default.warn(`[TSE] Nenhuma promessa encontrada para ${candidateName}`);
      return [];
    }
    return response.data.map((item) => ({
      candidateId,
      candidateName,
      electionYear: parseInt(item.ano_eleicao),
      promise: item.promessa,
      category: item.categoria,
      fulfilled: item.cumprida === "S",
      partiallyFulfilled: item.parcialmente_cumprida === "S",
      source: item.fonte
    }));
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar hist\xF3rico: ${error}`);
    return [];
  }
}
async function getPoliticalHistory(candidateName, state) {
  try {
    logger_default.info(`[TSE] Calculando hist\xF3rico pol\xEDtico: ${candidateName}`);
    const candidate = await getCandidateInfo(candidateName, state);
    if (!candidate) {
      return null;
    }
    const promises = await getCandidatePromiseHistory(candidate.id, candidateName);
    const elections = await getCandidateElectionHistory(candidate.id);
    const totalElected = elections.filter((e) => e.elected).length;
    const electionRate = elections.length > 0 ? totalElected / elections.length * 100 : 0;
    const promisesFulfilled = promises.filter((p) => p.fulfilled).length;
    const promisesPartial = promises.filter((p) => p.partiallyFulfilled).length;
    const fulfillmentRate = promises.length > 0 ? (promisesFulfilled + promisesPartial * 0.5) / promises.length * 100 : 0;
    const controversies = await getControversies(candidateName);
    const scandals = await getScandalCount(candidateName);
    return {
      candidateId: candidate.id,
      candidateName,
      totalElections: elections.length,
      totalElected,
      electionRate,
      promisesFulfilled,
      promisesTotal: promises.length,
      fulfillmentRate,
      controversies,
      scandals
    };
  } catch (error) {
    logger_default.error(`[TSE] Erro ao calcular hist\xF3rico: ${error}`);
    return null;
  }
}
async function getCandidateElectionHistory(candidateId) {
  try {
    const response = await axios3.get(`${TSE_API_BASE}/candidatos/${candidateId}/eleicoes`, {
      timeout: 1e4
    });
    if (!response.data || response.data.length === 0) {
      return [];
    }
    return response.data.map((item) => ({
      id: item.id,
      name: item.nome,
      party: item.partido,
      position: item.cargo,
      state: item.uf,
      city: item.municipio,
      electionYear: parseInt(item.ano_eleicao),
      votes: parseInt(item.votos || 0),
      elected: item.eleito === "S"
    }));
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar hist\xF3rico de elei\xE7\xF5es: ${error}`);
    return [];
  }
}
async function getControversies(candidateName) {
  try {
    const response = await axios3.get(`${TSE_API_BASE}/controversias`, {
      params: {
        candidato: candidateName
      },
      timeout: 1e4
    });
    return response.data?.length || 0;
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar controv\xE9rsias: ${error}`);
    return 0;
  }
}
async function getScandalCount(candidateName) {
  try {
    const response = await axios3.get(`${TSE_API_BASE}/scandals`, {
      params: {
        candidato: candidateName
      },
      timeout: 1e4
    });
    return response.data?.length || 0;
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar esc\xE2ndalos: ${error}`);
    return 0;
  }
}
async function syncTSEData(candidates) {
  try {
    logger_default.info("[TSE] Iniciando sincroniza\xE7\xE3o de dados");
    for (const candidate of candidates) {
      const history = await getPoliticalHistory(candidate.name, candidate.state);
      if (history) {
        logger_default.debug(`[TSE] Sincronizado: ${candidate.name} (${candidate.state})`);
      }
    }
    logger_default.info("[TSE] Sincroniza\xE7\xE3o conclu\xEDda");
  } catch (error) {
    logger_default.error(`[TSE] Erro durante sincroniza\xE7\xE3o: ${error}`);
  }
}

// server/jobs/sync-public-data.ts
var SICONFI_CATEGORIES = [
  "EDUCATION",
  "HEALTH",
  "INFRASTRUCTURE",
  "EMPLOYMENT",
  "ECONOMY",
  "SECURITY",
  "ENVIRONMENT",
  "SOCIAL",
  "AGRICULTURE",
  "TRANSPORT"
];
var BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
];
var MAIN_CANDIDATES = [
  { name: "Candidato A", state: "SP" },
  { name: "Candidato B", state: "RJ" },
  { name: "Candidato C", state: "MG" }
];
async function syncAllPublicData() {
  try {
    logger_default.info("[SyncJob] Iniciando sincroniza\xE7\xE3o completa de dados p\xFAblicos");
    const startTime = Date.now();
    logger_default.info("[SyncJob] Sincronizando SICONFI...");
    await syncSiconfiData(SICONFI_CATEGORIES);
    logger_default.info("[SyncJob] SICONFI sincronizado com sucesso");
    logger_default.info("[SyncJob] Sincronizando Portal da Transpar\xEAncia...");
    await syncPortalData(SICONFI_CATEGORIES, BRAZILIAN_STATES);
    logger_default.info("[SyncJob] Portal da Transpar\xEAncia sincronizado com sucesso");
    logger_default.info("[SyncJob] Sincronizando TSE...");
    await syncTSEData(MAIN_CANDIDATES);
    logger_default.info("[SyncJob] TSE sincronizado com sucesso");
    const duration = Date.now() - startTime;
    logger_default.info(`[SyncJob] Sincroniza\xE7\xE3o completa conclu\xEDda em ${duration}ms`);
  } catch (error) {
    logger_default.error(`[SyncJob] Erro durante sincroniza\xE7\xE3o: ${error}`);
    throw error;
  }
}
var syncStatus = {
  lastSync: null,
  nextSync: null,
  status: "idle",
  lastError: null,
  successCount: 0,
  failureCount: 0
};
function getSyncStatus() {
  return { ...syncStatus };
}

// server/routes/admin.routes.ts
init_logger();
var router4 = Router4();
router4.post("/sync", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta a\xE7\xE3o." });
      return;
    }
    logInfo("[Admin] Sincroniza\xE7\xE3o manual disparada por: " + req.userId);
    syncAllPublicData().catch((err) => logError("[Admin] Erro na sincroniza\xE7\xE3o em background", err));
    res.json({
      message: "Sincroniza\xE7\xE3o iniciada em segundo plano.",
      status: "syncing"
    });
  } catch (error) {
    logError("[Admin] Erro ao disparar sincroniza\xE7\xE3o", error);
    res.status(500).json({ error: "Erro interno ao disparar sincroniza\xE7\xE3o" });
  }
});
router4.get("/sync/status", authMiddleware, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Acesso negado." });
      return;
    }
    const status = getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter status" });
  }
});
var admin_routes_default = router4;

// server/core/routes.ts
var analysisLimiter2 = rateLimit2({
  windowMs: 60 * 60 * 1e3,
  // 1 hora
  max: (req) => {
    return req.user ? 50 : 10;
  },
  message: "Muitas an\xE1lises. Tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false
});
var loginLimiter = rateLimit2({
  windowMs: 15 * 60 * 1e3,
  // 15 minutos
  max: 5,
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false
});
function setupRoutes(app2) {
  app2.use(requestLoggerMiddleware);
  app2.use("/api", csrfProtection);
  app2.get("/api/csrf-token", csrfTokenRoute);
  app2.use("/api/auth", loginLimiter, auth_default);
  app2.use("/api/analyze", analysis_routes_default);
  app2.use("/api/statistics", statistics_routes_default);
  app2.use("/api/admin", admin_routes_default);
  app2.get("/api/analysis/:id/export", optionalAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await getQuery(
        "SELECT * FROM analyses WHERE id = ?",
        [id]
      );
      if (!analysis) {
        res.status(404).json({ error: "An\xE1lise n\xE3o encontrada" });
        return;
      }
      const promises = await allQuery(
        "SELECT * FROM promises WHERE analysis_id = ?",
        [id]
      );
      const exportData = {
        analysis: {
          id: analysis.id,
          text: analysis.text,
          author: analysis.author,
          category: analysis.category,
          probabilityScore: analysis.probability_score,
          createdAt: analysis.created_at
        },
        promises,
        methodology: {
          description: "An\xE1lise de viabilidade de promessas pol\xEDticas",
          factors: [
            "Especificidade da promessa (25%)",
            "Conformidade hist\xF3rica (25%)",
            "Viabilidade or\xE7ament\xE1ria (20%)",
            "Realismo do prazo (15%)",
            "Hist\xF3rico do autor (15%)"
          ],
          disclaimer: "Esta an\xE1lise \xE9 probabil\xEDstica e n\xE3o acusat\xF3ria. Baseada em padr\xF5es lingu\xEDsticos e dados hist\xF3ricos."
        }
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="analise-${id}.json"`);
      res.json(exportData);
      const logId = nanoid5();
      await createAuditLog(
        logId,
        req.userId || null,
        "ANALYSIS_EXPORTED",
        "analysis",
        id,
        req.ip || null,
        req.get("user-agent") || null
      );
    } catch (error) {
      logError("Erro ao exportar an\xE1lise", error);
      res.status(500).json({ error: "Erro ao exportar an\xE1lise" });
    }
  });
  app2.delete("/api/user/data", authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "N\xE3o autenticado" });
        return;
      }
      await runQuery(
        "UPDATE analyses SET text = NULL, author = NULL WHERE user_id = ?",
        [userId]
      );
      await runQuery(
        "DELETE FROM refresh_tokens WHERE user_id = ?",
        [userId]
      );
      const logId = nanoid5();
      await createAuditLog(
        logId,
        userId,
        "USER_DATA_DELETED",
        "user",
        userId,
        req.ip || null,
        req.get("user-agent") || null
      );
      logInfo("Dados do usu\xE1rio deletados", { userId });
      res.json({ message: "Dados deletados com sucesso" });
    } catch (error) {
      logError("Erro ao deletar dados do usu\xE1rio", error);
      res.status(500).json({ error: "Erro ao deletar dados" });
    }
  });
  app2.get("/api/user/data/export", authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: "N\xE3o autenticado" });
        return;
      }
      const user = await getQuery(
        "SELECT id, email, name, role, created_at FROM users WHERE id = ?",
        [userId]
      );
      const analyses = await allQuery(
        "SELECT * FROM analyses WHERE user_id = ?",
        [userId]
      );
      const auditLogs = await allQuery(
        "SELECT * FROM audit_logs WHERE user_id = ?",
        [userId]
      );
      const exportData = {
        user,
        analyses,
        auditLogs,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="dados-usuario-${userId}.json"`);
      res.json(exportData);
      const logId = nanoid5();
      await createAuditLog(
        logId,
        userId,
        "USER_DATA_EXPORTED",
        "user",
        userId,
        req.ip || null,
        req.get("user-agent") || null
      );
    } catch (error) {
      logError("Erro ao exportar dados do usu\xE1rio", error);
      res.status(500).json({ error: "Erro ao exportar dados" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
}

// server/index.ts
import cookieParser from "cookie-parser";

// server/services/telegram.service.ts
import { Telegraf } from "telegraf";
init_logger();
var BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var TelegramService = class {
  bot = null;
  constructor() {
    if (BOT_TOKEN) {
      this.bot = new Telegraf(BOT_TOKEN);
      this.setupHandlers();
    }
  }
  setupHandlers() {
    if (!this.bot) return;
    this.bot.start((ctx) => {
      ctx.reply(
        "\u{1F44B} Bem-vindo ao Detector de Promessa Vazia!\n\nEnvie um texto, discurso ou postagem de um pol\xEDtico e eu analisarei a viabilidade das promessas para voc\xEA.\n\nComo usar:\n1. Cole o texto aqui\n2. Aguarde a an\xE1lise da nossa IA\n3. Receba o score de viabilidade instantaneamente!"
      );
    });
    this.bot.on("text", async (ctx) => {
      const text = ctx.message.text;
      if (text.length < 20) {
        return ctx.reply("\u26A0\uFE0F O texto \xE9 muito curto para uma an\xE1lise precisa. Tente enviar um par\xE1grafo mais completo.");
      }
      ctx.reply("\u{1F50D} Analisando promessas... Isso pode levar alguns segundos.");
      try {
        const result = await analysisService.createAnalysis(null, text, "Autor via Telegram", "GERAL");
        let response = `\u2705 *An\xE1lise Conclu\xEDda!*

`;
        response += `\u{1F4CA} *Score de Viabilidade:* ${(result.probabilityScore * 100).toFixed(1)}%
`;
        response += `\u{1F4DD} *Promessas Identificadas:* ${result.promisesCount}

`;
        if (result.promises.length > 0) {
          response += `*Principais Promessas:*
`;
          result.promises.slice(0, 3).forEach((p, i) => {
            response += `${i + 1}. ${p.text.substring(0, 100)}${p.text.length > 100 ? "..." : ""}
`;
            response += `   \u2514 Confian\xE7a: ${(p.confidence * 100).toFixed(0)}%

`;
          });
        }
        response += `\u{1F517} *Veja a an\xE1lise completa:* ${process.env.APP_URL || "http://localhost:3000"}/analysis/${result.id}`;
        ctx.replyWithMarkdown(response);
      } catch (error) {
        logError("Erro no Bot de Telegram", error);
        ctx.reply("\u274C Desculpe, ocorreu um erro ao processar sua an\xE1lise. Tente novamente mais tarde.");
      }
    });
  }
  start() {
    if (this.bot) {
      this.bot.launch();
      logInfo("Bot de Telegram iniciado com sucesso");
    } else {
      logInfo("Bot de Telegram n\xE3o iniciado (Token ausente)");
    }
  }
};
var telegramService = new TelegramService();

// server/index.ts
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
  const origin = req.headers.origin;
  if (process.env.NODE_ENV !== "production") {
    res.header("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
var clientBuildPath = path3.join(__dirname3, "../client/dist");
app.use(express.static(clientBuildPath));
(async () => {
  try {
    await initializeDatabase();
    setupRoutes(app);
    app.get("*", (req, res) => {
      res.sendFile(path3.join(clientBuildPath, "index.html"));
    });
    app.listen(PORT, () => {
      console.log(`[Detector de Promessa Vazia] Servidor iniciado em http://localhost:${PORT}`);
      console.log(`[Detector de Promessa Vazia] Ambiente: ${process.env.NODE_ENV || "development"}`);
      telegramService.start();
    });
  } catch (error) {
    console.error("[Detector de Promessa Vazia] Erro ao inicializar:", error);
    process.exit(1);
  }
})();
