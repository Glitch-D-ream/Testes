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
  getDatabase: () => getDatabase,
  getQuery: () => getQuery,
  getRefreshToken: () => getRefreshToken,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  initializeDatabase: () => initializeDatabase,
  runQuery: () => runQuery,
  updateLastLogin: () => updateLastLogin
});
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("[Database] Erro ao conectar:", err);
        reject(err);
      } else {
        console.log("[Database] Conectado ao SQLite em:", DB_PATH);
        createTables().then(resolve).catch(reject);
      }
    });
  });
}
async function createTables() {
  if (!db) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          is_active BOOLEAN DEFAULT 1
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela users:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token VARCHAR(500) NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela refresh_tokens:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS analyses (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          text TEXT NOT NULL,
          author TEXT,
          category TEXT,
          extracted_promises TEXT,
          probability_score REAL,
          methodology_notes TEXT,
          data_sources TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela analyses:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS promises (
          id TEXT PRIMARY KEY,
          analysis_id TEXT NOT NULL,
          promise_text TEXT NOT NULL,
          category TEXT,
          confidence_score REAL,
          extracted_entities TEXT,
          FOREIGN KEY(analysis_id) REFERENCES analyses(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela promises:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          action VARCHAR(255) NOT NULL,
          resource_type VARCHAR(100),
          resource_id TEXT,
          ip_address VARCHAR(45),
          user_agent TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela audit_logs:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS consents (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data_processing BOOLEAN DEFAULT 0,
          privacy_policy BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela consents:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS public_data_cache (
          id TEXT PRIMARY KEY,
          data_type TEXT NOT NULL,
          data_source TEXT NOT NULL,
          data_content TEXT NOT NULL,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          expiry_date DATETIME
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela public_data_cache:", err);
      });
      db.run(`
        CREATE TABLE IF NOT EXISTS analysis_history (
          id TEXT PRIMARY KEY,
          analysis_id TEXT NOT NULL,
          action TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(analysis_id) REFERENCES analyses(id)
        )
      `, (err) => {
        if (err) console.error("[Database] Erro ao criar tabela analysis_history:", err);
        else {
          console.log("[Database] Tabelas criadas com sucesso");
          resolve();
        }
      });
    });
  });
}
function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}
function runQuery(sql, params = []) {
  if (!db) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function getQuery(sql, params = []) {
  if (!db) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function allQuery(sql, params = []) {
  if (!db) throw new Error("Database not initialized");
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
async function getUserById(userId) {
  return getQuery(
    "SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?",
    [userId]
  );
}
async function getUserByEmail(email) {
  return getQuery(
    "SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ?",
    [email]
  );
}
async function createUser(id, email, passwordHash, name) {
  await runQuery(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
    [id, email, passwordHash, name, "user"]
  );
  return getUserById(id);
}
async function updateLastLogin(userId) {
  await runQuery(
    "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
    [userId]
  );
}
async function createAuditLog(id, userId, action, resourceType, resourceId, ipAddress, userAgent) {
  await runQuery(
    `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, action, resourceType, resourceId, ipAddress, userAgent]
  );
}
async function createRefreshToken(id, userId, token, expiresAt) {
  await runQuery(
    "INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
    [id, userId, token, expiresAt]
  );
}
async function getRefreshToken(token) {
  return getQuery(
    "SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP",
    [token]
  );
}
async function deleteRefreshToken(token) {
  await runQuery("DELETE FROM refresh_tokens WHERE token = ?", [token]);
}
async function createConsent(id, userId, dataProcessing, privacyPolicy) {
  await runQuery(
    "INSERT INTO consents (id, user_id, data_processing, privacy_policy) VALUES (?, ?, ?, ?)",
    [id, userId, dataProcessing ? 1 : 0, privacyPolicy ? 1 : 0]
  );
}
async function getConsent(userId) {
  return getQuery(
    "SELECT id, user_id, data_processing, privacy_policy, created_at FROM consents WHERE user_id = ?",
    [userId]
  );
}
var __filename, __dirname, DB_PATH, db;
var init_database = __esm({
  "server/core/database.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "../../data/detector.db");
    db = null;
  }
});

// server/index.ts
init_database();
import express from "express";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";

// server/core/routes.ts
import rateLimit from "express-rate-limit";
import { nanoid as nanoid2 } from "nanoid";

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

// server/core/routes.ts
init_database();

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

// server/core/logger.ts
import winston from "winston";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var logsDir = path2.join(__dirname2, "../../logs");
var logger = winston.createLogger({
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
      filename: path2.join(logsDir, "error.log"),
      level: "error",
      maxsize: 10485760,
      // 10MB
      maxFiles: 5
    }),
    // Arquivo de logs gerais
    new winston.transports.File({
      filename: path2.join(logsDir, "combined.log"),
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

// server/routes/auth.ts
import { Router } from "express";
import { nanoid } from "nanoid";
init_database();
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
    const userId = nanoid();
    const passwordHash = await hashPassword(password);
    await createUser(userId, email, passwordHash, name);
    const consentId = nanoid();
    await createConsent(consentId, userId, true, true);
    const logId = nanoid();
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
    const refreshTokenId = nanoid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    await createRefreshToken(refreshTokenId, user.id, refreshTokenValue, expiresAt);
    const logId = nanoid();
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
        const db2 = (init_database(), __toCommonJS(database_exports)).getDatabase();
        db2.get(sql, [payload.userId], (err, row) => {
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
    const logId = nanoid();
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

// server/core/routes.ts
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
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutos
  max: 5,
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false
});
function setupRoutes(app2) {
  app2.use(requestLoggerMiddleware);
  app2.use("/api/auth", loginLimiter, auth_default);
  app2.post("/api/analyze", optionalAuthMiddleware, analysisLimiter, async (req, res) => {
    try {
      const validation = validate(AnalysisSchema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }
      const { text, author, category } = validation.data;
      const analysisId = nanoid2();
      const userId = req.userId || null;
      const promises = extractPromises(text);
      const probabilityScore = calculateProbability(promises, category);
      await runQuery(
        `INSERT INTO analyses (id, user_id, text, author, category, extracted_promises, probability_score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [analysisId, userId, text, author, category, JSON.stringify(promises), probabilityScore]
      );
      for (const promise of promises) {
        const promiseId = nanoid2();
        await runQuery(
          `INSERT INTO promises (id, analysis_id, promise_text, category, confidence_score)
           VALUES (?, ?, ?, ?, ?)`,
          [promiseId, analysisId, promise.text, promise.category, promise.confidence]
        );
      }
      const logId = nanoid2();
      await createAuditLog(
        logId,
        userId,
        "ANALYSIS_CREATED",
        "analysis",
        analysisId,
        req.ip || null,
        req.get("user-agent") || null
      );
      logInfo("An\xE1lise criada", { analysisId, userId, promisesCount: promises.length });
      res.status(201).json({
        id: analysisId,
        probabilityScore,
        promisesCount: promises.length,
        promises
      });
    } catch (error) {
      logError("Erro ao criar an\xE1lise", error);
      res.status(500).json({ error: "Erro ao criar an\xE1lise" });
    }
  });
  app2.get("/api/analysis/:id", optionalAuthMiddleware, async (req, res) => {
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
      res.json({
        ...analysis,
        promises,
        extracted_promises: JSON.parse(analysis.extracted_promises || "[]")
      });
    } catch (error) {
      logError("Erro ao obter an\xE1lise", error);
      res.status(500).json({ error: "Erro ao obter an\xE1lise" });
    }
  });
  app2.get("/api/analyses", optionalAuthMiddleware, async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;
      const analyses = await allQuery(
        `SELECT id, author, category, probability_score, created_at
         FROM analyses
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const total = await getQuery("SELECT COUNT(*) as count FROM analyses");
      res.json({
        analyses,
        total: total.count,
        limit,
        offset
      });
    } catch (error) {
      logError("Erro ao listar an\xE1lises", error);
      res.status(500).json({ error: "Erro ao listar an\xE1lises" });
    }
  });
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
      const logId = nanoid2();
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
      const logId = nanoid2();
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
      const logId = nanoid2();
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
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
    });
  } catch (error) {
    console.error("[Detector de Promessa Vazia] Erro ao inicializar:", error);
    process.exit(1);
  }
})();
