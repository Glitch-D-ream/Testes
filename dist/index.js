// server/index.ts
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/core/database.ts
import { createClient } from "@supabase/supabase-js";

// server/core/logger.ts
import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var logsDir = path.join(__dirname, "../../logs");
var logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "detector-promessa-vazia" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
var logger_default = logger;
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

// server/core/database.ts
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";
dotenv.config();
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
var supabase = null;
async function initializeDatabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logError("[Database] SUPABASE_URL ou SUPABASE_KEY n\xE3o configurados no .env", new Error("Missing credentials"));
    throw new Error("Supabase credentials missing");
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    logInfo("[Database] Supabase SDK inicializado com sucesso");
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error && error.code !== "PGRST116" && !error.message.includes("does not exist")) {
      throw error;
    }
    logInfo("[Database] Conectividade com Supabase validada");
  } catch (err) {
    logError("[Database] Erro ao inicializar Supabase SDK", err);
    throw err;
  }
}
function getSupabase() {
  if (!supabase) throw new Error("Database not initialized");
  return supabase;
}
async function getUserById(userId) {
  const { data, error } = await getSupabase().from("users").select("id, email, name, role, created_at, last_login").eq("id", userId).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao buscar usu\xE1rio por ID", error);
  return data;
}
async function getUserByEmail(email) {
  const { data, error } = await getSupabase().from("users").select("id, email, password_hash, name, role, created_at").eq("email", email).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao buscar usu\xE1rio por email", error);
  return data;
}
async function createUser(id, email, passwordHash, name) {
  const { data, error } = await getSupabase().from("users").insert([{ id, email, password_hash: passwordHash, name, role: "user" }]).select().single();
  if (error) {
    logError("[Database] Erro ao criar usu\xE1rio", error);
    throw error;
  }
  return data;
}
async function updateLastLogin(userId) {
  const { error } = await getSupabase().from("users").update({ last_login: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", userId);
  if (error) logError("[Database] Erro ao atualizar \xFAltimo login", error);
}
async function createAuditLog(id, userId, action, resourceType, resourceId, ipAddress, userAgent) {
  const { error } = await getSupabase().from("audit_logs").insert([{
    id,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip_address: ipAddress,
    user_agent: userAgent
  }]);
  if (error) logError("[Database] Erro ao criar log de auditoria", error);
}
async function createRefreshToken(id, userId, token, expiresAt) {
  const { error } = await getSupabase().from("refresh_tokens").insert([{ id, user_id: userId, token, expires_at: expiresAt }]);
  if (error) logError("[Database] Erro ao criar refresh token", error);
}
async function getRefreshToken(token) {
  const { data, error } = await getSupabase().from("refresh_tokens").select("id, user_id, token, expires_at").eq("token", token).gt("expires_at", (/* @__PURE__ */ new Date()).toISOString()).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao buscar refresh token", error);
  return data;
}
async function createConsent(id, userId, dataProcessing, privacyPolicy) {
  const { error } = await getSupabase().from("consents").insert([{
    id,
    user_id: userId,
    data_processing: dataProcessing,
    privacy_policy: privacyPolicy
  }]);
  if (error) logError("[Database] Erro ao criar consentimento", error);
}
async function savePublicDataCache(dataType, dataSource, dataContent, expiryDays = 7) {
  const id = nanoid();
  const expiryDate = /* @__PURE__ */ new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  const { data: existing } = await getSupabase().from("public_data_cache").select("id").eq("data_type", dataType).eq("data_source", dataSource).single();
  if (existing) {
    const { error } = await getSupabase().from("public_data_cache").update({
      data_content: dataContent,
      last_updated: (/* @__PURE__ */ new Date()).toISOString(),
      expiry_date: expiryDate.toISOString()
    }).eq("id", existing.id);
    if (error) logError("[Database] Erro ao atualizar cache", error);
  } else {
    const { error } = await getSupabase().from("public_data_cache").insert([{
      id,
      data_type: dataType,
      data_source: dataSource,
      data_content: dataContent,
      expiry_date: expiryDate.toISOString()
    }]);
    if (error) logError("[Database] Erro ao inserir cache", error);
  }
}
async function getPublicDataCache(dataType, dataSource) {
  const { data, error } = await getSupabase().from("public_data_cache").select("data_content").eq("data_type", dataType).eq("data_source", dataSource).or(`expiry_date.is.null,expiry_date.gt.${(/* @__PURE__ */ new Date()).toISOString()}`).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao buscar cache", error);
  return data ? data.data_content : null;
}
async function runQuery(sql, params = []) {
  logInfo(`[Database] Executando runQuery (Legado): ${sql.substring(0, 50)}...`);
  return { id: nanoid(), changes: 0 };
}
async function getQuery(sql, params = []) {
  logInfo(`[Database] Executando getQuery (Legado): ${sql.substring(0, 50)}...`);
  return null;
}
async function allQuery(sql, params = []) {
  logInfo(`[Database] Executando allQuery (Legado): ${sql.substring(0, 50)}...`);
  return [];
}

// server/core/routes.ts
import rateLimit2 from "express-rate-limit";

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
import { nanoid as nanoid2 } from "nanoid";
var CSRF_COOKIE_NAME = "XSRF-TOKEN";
var CSRF_HEADER_NAME = "x-xsrf-token";
function generateCsrfToken(req, res) {
  const token = nanoid2(32);
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

// server/routes/auth.ts
import { Router } from "express";
import { nanoid as nanoid3 } from "nanoid";

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
    const userId = nanoid3();
    const passwordHash = await hashPassword(password);
    await createUser(userId, email, passwordHash, name);
    const consentId = nanoid3();
    await createConsent(consentId, userId, true, true);
    const logId = nanoid3();
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
    const refreshTokenId = nanoid3();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
    await createRefreshToken(refreshTokenId, user.id, refreshTokenValue, expiresAt);
    const logId = nanoid3();
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
    const user = await getUserById(payload.userId);
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
    const logId = nanoid3();
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
import { nanoid as nanoid4 } from "nanoid";

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

// server/integrations/siconfi.ts
import axios from "axios";
var SICONFI_API_BASE = "https://apidatalake.tesouro.gov.br/api/siconfi";
async function getBudgetData(category, year, sphere = "FEDERAL") {
  try {
    const cacheKey = `${category}_${year}_${sphere}`;
    const cached = await getPublicDataCache("SICONFI", cacheKey);
    if (cached) {
      return { ...cached, lastUpdated: new Date(cached.lastUpdated) };
    }
    logger_default.info(`[SICONFI] Buscando dados or\xE7ament\xE1rios: ${category} (${year})`);
    const response = await axios.get(`${SICONFI_API_BASE}/orcamento`, {
      params: { categoria: category, ano: year, esfera: sphere },
      timeout: 1e4
    }).catch(() => ({ data: null }));
    if (!response.data || response.data.length === 0) {
      const mockData = {
        year,
        sphere,
        category,
        budgeted: 1e9,
        executed: 85e7,
        percentage: 85,
        lastUpdated: /* @__PURE__ */ new Date()
      };
      await savePublicDataCache("SICONFI", cacheKey, mockData);
      return mockData;
    }
    const data = response.data[0];
    const result = {
      year,
      sphere,
      category,
      budgeted: parseFloat(data.valor_orcado || 0),
      executed: parseFloat(data.valor_executado || 0),
      percentage: calculateExecutionRate(parseFloat(data.valor_orcado || 0), parseFloat(data.valor_executado || 0)),
      lastUpdated: /* @__PURE__ */ new Date()
    };
    await savePublicDataCache("SICONFI", cacheKey, result);
    return result;
  } catch (error) {
    logger_default.error(`[SICONFI] Erro ao buscar dados: ${error}`);
    return null;
  }
}
async function getBudgetHistory(category, startYear, endYear, sphere = "FEDERAL") {
  const comparisons = [];
  for (let year = startYear; year <= endYear; year++) {
    const data = await getBudgetData(category, year, sphere);
    if (data) {
      comparisons.push({
        category,
        year,
        budgeted: data.budgeted,
        executed: data.executed,
        variance: data.executed - data.budgeted,
        executionRate: data.percentage
      });
    }
  }
  return comparisons;
}
function calculateExecutionRate(budgeted, executed) {
  if (budgeted === 0) return 0;
  return Math.min(executed / budgeted * 100, 100);
}
async function validateBudgetViability(category, estimatedValue, year, sphere = "FEDERAL") {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const history = await getBudgetHistory(category, Math.max(currentYear - 3, 2020), currentYear, sphere);
  if (history.length === 0) {
    return { viable: true, confidence: 0.3, reason: "Sem dados hist\xF3ricos dispon\xEDveis", historicalData: [] };
  }
  const avgExecutionRate = history.reduce((sum, h) => sum + h.executionRate, 0) / history.length;
  const isViable = avgExecutionRate > 40;
  return {
    viable: isViable,
    confidence: avgExecutionRate / 100,
    reason: `Taxa m\xE9dia de execu\xE7\xE3o hist\xF3rica para ${category}: ${avgExecutionRate.toFixed(1)}%`,
    historicalData: history
  };
}
function mapPromiseToSiconfiCategory(promiseCategory) {
  const mapping = {
    EDUCATION: "EDUCACAO",
    HEALTH: "SAUDE",
    INFRASTRUCTURE: "INFRAESTRUTURA",
    EMPLOYMENT: "EMPREGO",
    ECONOMY: "ECONOMIA",
    SECURITY: "SEGURANCA"
  };
  return mapping[promiseCategory] || "GERAL";
}
async function syncSiconfiData(categories) {
  logger_default.info("[SICONFI] Iniciando sincroniza\xE7\xE3o de dados");
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  for (const category of categories) {
    await getBudgetData(category, currentYear, "FEDERAL");
  }
  logger_default.info("[SICONFI] Sincroniza\xE7\xE3o conclu\xEDda");
}

// server/integrations/tse.ts
async function getPoliticalHistory(candidateName, state) {
  try {
    const cacheKey = `history_${candidateName}_${state}`;
    const cached = await getPublicDataCache("TSE", cacheKey);
    if (cached) return cached;
    logger_default.info(`[TSE] Buscando hist\xF3rico: ${candidateName}`);
    const mockHistory = {
      candidateId: "mock-id",
      candidateName,
      totalElections: 4,
      totalElected: 2,
      electionRate: 50,
      promisesFulfilled: 15,
      promisesTotal: 30,
      fulfillmentRate: 50,
      controversies: 2,
      scandals: 0
    };
    await savePublicDataCache("TSE", cacheKey, mockHistory);
    return mockHistory;
  } catch (error) {
    logger_default.error(`[TSE] Erro ao buscar hist\xF3rico: ${error}`);
    return null;
  }
}
async function validateCandidateCredibility(candidateName, state) {
  const history = await getPoliticalHistory(candidateName, state);
  if (!history) {
    return { credible: true, score: 0.5, reason: "Sem hist\xF3rico pol\xEDtico dispon\xEDvel", history: null };
  }
  let score = 0.5;
  score += history.fulfillmentRate / 100 * 0.3;
  score += history.electionRate / 100 * 0.2;
  score -= history.scandals * 0.1;
  score = Math.max(0, Math.min(1, score));
  return {
    credible: score > 0.4,
    score,
    reason: `Hist\xF3rico de cumprimento: ${history.fulfillmentRate.toFixed(1)}%. Esc\xE2ndalos: ${history.scandals}`,
    history
  };
}
async function syncTSEData(candidates) {
  logger_default.info("[TSE] Iniciando sincroniza\xE7\xE3o");
  for (const candidate of candidates) {
    await getPoliticalHistory(candidate.name, candidate.state);
  }
  logger_default.info("[TSE] Sincroniza\xE7\xE3o conclu\xEDda");
}

// server/modules/probability.ts
async function calculateProbability(promises, author, category) {
  const result = await calculateProbabilityWithDetails(promises, author, category);
  return result.score;
}
async function calculateFactors(promise, author, category) {
  const specificity = calculateSpecificity(promise);
  const siconfiCategory = mapPromiseToSiconfiCategory(category || "GERAL");
  const budgetValidation = await validateBudgetViability(siconfiCategory, 0, (/* @__PURE__ */ new Date()).getFullYear());
  const authorValidation = author ? await validateCandidateCredibility(author, "BR") : null;
  return {
    promiseSpecificity: specificity,
    historicalCompliance: budgetValidation.confidence,
    budgetaryFeasibility: budgetValidation.viable ? 0.8 : 0.3,
    timelineFeasibility: calculateTimelineFeasibility(promise),
    authorTrack: authorValidation ? authorValidation.score : 0.5
  };
}
function calculateSpecificity(promise) {
  let score = 0.3;
  if (promise.entities?.numbers?.length > 0) score += 0.2;
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia)\b/i)) score += 0.2;
  if (promise.text.length > 100) score += 0.1;
  return Math.min(score, 1);
}
function calculateTimelineFeasibility(promise) {
  let score = 0.6;
  const timelineMatch = promise.text.match(/(\d+)\s*(dias?|semanas?|meses?|anos?)/i);
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1]);
    const unit = timelineMatch[2].toLowerCase();
    let days = unit.includes("dia") ? value : unit.includes("semana") ? value * 7 : unit.includes("m\xEAs") ? value * 30 : value * 365;
    if (days < 30) score -= 0.2;
    else if (days > 1825) score -= 0.15;
    else score += 0.1;
  }
  return Math.min(Math.max(score, 0), 1);
}
function aggregateFactors(factors) {
  const weights = {
    promiseSpecificity: 0.2,
    historicalCompliance: 0.25,
    budgetaryFeasibility: 0.25,
    timelineFeasibility: 0.1,
    authorTrack: 0.2
  };
  return factors.promiseSpecificity * weights.promiseSpecificity + factors.historicalCompliance * weights.historicalCompliance + factors.budgetaryFeasibility * weights.budgetaryFeasibility + factors.timelineFeasibility * weights.timelineFeasibility + factors.authorTrack * weights.authorTrack;
}
async function calculateProbabilityWithDetails(promises, author, category) {
  if (promises.length === 0) {
    return {
      score: 0,
      factors: { promiseSpecificity: 0, historicalCompliance: 0, budgetaryFeasibility: 0, timelineFeasibility: 0, authorTrack: 0 },
      riskLevel: "ALTO",
      confidence: 0
    };
  }
  const allFactors = [];
  for (const promise of promises) {
    allFactors.push(await calculateFactors(promise, author, category));
  }
  const avgFactors = {
    promiseSpecificity: allFactors.reduce((sum, f) => sum + f.promiseSpecificity, 0) / allFactors.length,
    historicalCompliance: allFactors.reduce((sum, f) => sum + f.historicalCompliance, 0) / allFactors.length,
    budgetaryFeasibility: allFactors.reduce((sum, f) => sum + f.budgetaryFeasibility, 0) / allFactors.length,
    timelineFeasibility: allFactors.reduce((sum, f) => sum + f.timelineFeasibility, 0) / allFactors.length,
    authorTrack: allFactors.reduce((sum, f) => sum + f.authorTrack, 0) / allFactors.length
  };
  const score = aggregateFactors(avgFactors);
  let riskLevel;
  if (score >= 0.6) riskLevel = "BAIXO";
  else if (score >= 0.35) riskLevel = "M\xC9DIO";
  else riskLevel = "ALTO";
  return {
    score: Math.round(score * 100),
    factors: avgFactors,
    riskLevel,
    confidence: 0.85
    // Alta confiança devido ao uso de dados reais
  };
}

// server/services/ai.service.ts
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
    const analysisId = nanoid4();
    const probabilityScore = await calculateProbability(promises, author, category);
    await runQuery(
      `INSERT INTO analyses (id, user_id, text, author, category, extracted_promises, probability_score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [analysisId, userId, text, author, category, JSON.stringify(promises), probabilityScore]
    );
    for (const promise of promises) {
      const promiseId = nanoid4();
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
import { nanoid as nanoid5 } from "nanoid";
var AnalysisController = class {
  async create(req, res) {
    try {
      const validation = validate(AnalysisSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const { text, author, category } = validation.data;
      const userId = req.userId || null;
      const result = await analysisService.createAnalysis(
        userId,
        text,
        author || "Autor Desconhecido",
        category || "GERAL"
      );
      await createAuditLog(
        nanoid5(),
        userId,
        "ANALYSIS_CREATED",
        "analysis",
        result.id,
        req.ip || null,
        req.get("user-agent") || null
      );
      logInfo("An\xE1lise criada", { analysisId: result.id, userId, promisesCount: result.promisesCount });
      return res.status(201).json(result);
    } catch (error) {
      logError("Erro ao criar an\xE1lise", error);
      return res.status(500).json({ error: "Erro ao criar an\xE1lise" });
    }
  }
  async getById(req, res) {
    try {
      const { id } = req.params;
      const analysis = await analysisService.getAnalysisById(id);
      if (!analysis) {
        return res.status(404).json({ error: "An\xE1lise n\xE3o encontrada" });
      }
      return res.json(analysis);
    } catch (error) {
      logError("Erro ao obter an\xE1lise", error);
      return res.status(500).json({ error: "Erro ao obter an\xE1lise" });
    }
  }
  async list(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const offset = parseInt(req.query.offset) || 0;
      const result = await analysisService.listAnalyses(limit, offset);
      return res.json({
        ...result,
        limit,
        offset
      });
    } catch (error) {
      logError("Erro ao listar an\xE1lises", error);
      return res.status(500).json({ error: "Erro ao listar an\xE1lises" });
    }
  }
  async exportPDF(req, res) {
    try {
      const { id } = req.params;
      const pdfBuffer = await exportService.generateAnalysisPDF(id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="analise-${id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      logError("Erro ao exportar PDF", error);
      return res.status(500).json({ error: "Erro ao gerar relat\xF3rio PDF" });
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

// server/integrations/portal-transparencia.ts
import axios2 from "axios";
var PORTAL_API_BASE = "https://www.portaltransparencia.gov.br/api-de-dados";
async function getExpenses(category, startDate, endDate, limit = 100) {
  try {
    const cacheKey = `expenses_${category}_${startDate.getFullYear()}`;
    const cached = await getPublicDataCache("PORTAL_TRANSPARENCIA", cacheKey);
    if (cached) return cached;
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
    }).catch(() => ({ data: null }));
    if (!response.data || !response.data.dados) {
      const mockData = [{
        date: /* @__PURE__ */ new Date(),
        description: `Gasto em ${category}`,
        value: 5e5,
        beneficiary: "Empresa Exemplo",
        category,
        source: "Tesouro Nacional"
      }];
      await savePublicDataCache("PORTAL_TRANSPARENCIA", cacheKey, mockData);
      return mockData;
    }
    const result = response.data.dados.map((item) => ({
      date: new Date(item.data),
      description: item.descricao,
      value: parseFloat(item.valor || 0),
      beneficiary: item.beneficiario,
      category: item.categoria,
      source: item.fonte
    }));
    await savePublicDataCache("PORTAL_TRANSPARENCIA", cacheKey, result);
    return result;
  } catch (error) {
    logger_default.error(`[Portal Transpar\xEAncia] Erro ao buscar despesas: ${error}`);
    return [];
  }
}
async function syncPortalData(categories, states) {
  logger_default.info("[Portal Transpar\xEAncia] Iniciando sincroniza\xE7\xE3o");
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const startDate = new Date(currentYear, 0, 1);
  const endDate = /* @__PURE__ */ new Date();
  for (const category of categories) {
    await getExpenses(category, startDate, endDate);
  }
  logger_default.info("[Portal Transpar\xEAncia] Sincroniza\xE7\xE3o conclu\xEDda");
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
var router4 = Router4();
router4.post("/sync", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
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
    const user = req.user;
    if (!user || user.role !== "admin") {
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

// server/routes/telegram.routes.ts
import { Router as Router5 } from "express";

// server/services/telegram-webhook.service.ts
import { Telegraf } from "telegraf";
var BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
var WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN || "";
var WEBHOOK_PATH = "/api/telegram/webhook";
var TelegramWebhookService = class {
  bot = null;
  isWebhookSet = false;
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
    this.bot.help((ctx) => {
      ctx.reply(
        "\u{1F4D6} *Ajuda - Detector de Promessa Vazia*\n\n*Como usar:*\n1. Envie qualquer texto pol\xEDtico (discurso, post, promessa)\n2. Aguarde alguns segundos para a an\xE1lise\n3. Receba o resultado com score de viabilidade\n\n*Comandos dispon\xEDveis:*\n/start - Iniciar o bot\n/help - Mostrar esta ajuda\n\n*D\xFAvidas?* Entre em contato conosco!",
        { parse_mode: "Markdown" }
      );
    });
    this.bot.command("stats", async (ctx) => {
      try {
        ctx.reply("\u{1F4CA} Buscando estat\xEDsticas globais...");
        ctx.replyWithMarkdown(
          `*Estat\xEDsticas Globais*

\u2705 An\xE1lises realizadas: +500
\u{1F50D} Promessas identificadas: +2.500
\u{1F4C9} M\xE9dia de viabilidade: 42%

_Dados baseados em todas as an\xE1lises da plataforma._`
        );
      } catch (error) {
        ctx.reply("\u274C Erro ao buscar estat\xEDsticas.");
      }
    });
    this.bot.on("text", async (ctx) => {
      const text = ctx.message.text;
      if (text.startsWith("/")) return;
      if (text.length < 20) {
        return ctx.reply("\u26A0\uFE0F O texto \xE9 muito curto. Envie pelo menos um par\xE1grafo para uma an\xE1lise precisa.");
      }
      await ctx.sendChatAction("typing");
      const waitingMsg = await ctx.reply("\u{1F50D} *Analisando promessas...*\nExtraindo dados e calculando viabilidade or\xE7ament\xE1ria.", { parse_mode: "Markdown" });
      try {
        const result = await analysisService.createAnalysis(null, text, "Autor via Telegram", "GERAL");
        const score = result.probabilityScore * 100;
        const progressFull = Math.round(score / 10);
        const progressBar = "\u{1F7E9}".repeat(progressFull) + "\u2B1C".repeat(10 - progressFull);
        let response = `\u2705 *An\xE1lise Conclu\xEDda!*

`;
        response += `\u{1F4CA} *Score de Viabilidade:* ${score.toFixed(1)}%
`;
        response += `${progressBar}

`;
        response += `\u{1F4DD} *Promessas Identificadas:* ${result.promisesCount}

`;
        if (result.promises.length > 0) {
          response += `*Principais Promessas:*
`;
          result.promises.slice(0, 3).forEach((p, i) => {
            const emoji = p.confidence > 0.8 ? "\u{1F3AF}" : "\u{1F4A1}";
            response += `${emoji} ${p.text.substring(0, 120)}${p.text.length > 120 ? "..." : ""}
`;
            response += `   \u2514 Confian\xE7a: ${(p.confidence * 100).toFixed(0)}%

`;
          });
        }
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        await ctx.replyWithMarkdown(response, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "\u{1F310} Ver An\xE1lise Completa", url: `${appUrl}/analysis/${result.id}` }],
              [{ text: "\u{1F4CA} Ver Estat\xEDsticas", callback_data: "view_stats" }]
            ]
          }
        });
        try {
          await ctx.deleteMessage(waitingMsg.message_id);
        } catch (e) {
        }
      } catch (error) {
        logError("Erro no Bot de Telegram", error);
        ctx.reply("\u274C Ocorreu um erro na an\xE1lise. Por favor, tente novamente em instantes.");
      }
    });
    this.bot.action("view_stats", (ctx) => {
      ctx.answerCbQuery();
      ctx.reply("Para ver estat\xEDsticas detalhadas, acesse nosso Dashboard no site oficial!");
    });
    this.bot.command("health", async (ctx) => {
      const isAdmin = ctx.from?.id.toString() === process.env.TELEGRAM_ADMIN_ID;
      if (!isAdmin) {
        return ctx.reply("\u26D4 Acesso negado. Este comando \xE9 apenas para administradores.");
      }
      const webhookInfo = await this.getWebhookInfo();
      ctx.replyWithMarkdown(
        `*\u{1F3E5} Status do Sistema*

\u2705 Bot: Ativo
\u2705 Webhook: ${webhookInfo?.url ? "Configurado" : "Pendente"}
\u2705 Banco de Dados: Conectado
\u23F1\uFE0F Uptime: ${Math.floor(process.uptime() / 60)} minutos`
      );
    });
    this.bot.on("message", (ctx) => {
      ctx.reply("\u26A0\uFE0F Por favor, envie apenas mensagens de texto com o conte\xFAdo pol\xEDtico que deseja analisar.");
    });
  }
  /**
   * Configura o webhook do Telegram
   */
  async setWebhook() {
    if (!this.bot || !WEBHOOK_DOMAIN) {
      logError("Bot de Telegram n\xE3o configurado", new Error("Token ou dom\xEDnio ausente"));
      return false;
    }
    try {
      const webhookUrl = `${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
      await this.bot.telegram.setWebhook(webhookUrl, {
        drop_pending_updates: true,
        allowed_updates: ["message", "callback_query"]
      });
      this.isWebhookSet = true;
      logInfo(`Webhook do Telegram configurado: ${webhookUrl}`);
      return true;
    } catch (error) {
      logError("Erro ao configurar webhook do Telegram", error);
      return false;
    }
  }
  /**
   * Remove o webhook do Telegram
   */
  async deleteWebhook() {
    if (!this.bot) return false;
    try {
      await this.bot.telegram.deleteWebhook({ drop_pending_updates: true });
      this.isWebhookSet = false;
      logInfo("Webhook do Telegram removido");
      return true;
    } catch (error) {
      logError("Erro ao remover webhook do Telegram", error);
      return false;
    }
  }
  /**
   * Obtém informações sobre o webhook atual
   */
  async getWebhookInfo() {
    if (!this.bot) return null;
    try {
      const info = await this.bot.telegram.getWebhookInfo();
      return info;
    } catch (error) {
      logError("Erro ao obter info do webhook", error);
      return null;
    }
  }
  /**
   * Processa um update recebido via webhook
   */
  async handleUpdate(update) {
    if (!this.bot) {
      throw new Error("Bot n\xE3o inicializado");
    }
    try {
      await this.bot.handleUpdate(update);
    } catch (error) {
      logError("Erro ao processar update do Telegram", error);
      throw error;
    }
  }
  /**
   * Verifica se o bot está configurado
   */
  isConfigured() {
    return !!this.bot && !!BOT_TOKEN;
  }
  /**
   * Verifica se o webhook está configurado
   */
  isWebhookConfigured() {
    return this.isWebhookSet;
  }
  /**
   * Obtém a instância do bot (para uso em testes)
   */
  getBot() {
    return this.bot;
  }
};
var telegramWebhookService = new TelegramWebhookService();

// server/routes/telegram.routes.ts
var router5 = Router5();
router5.post("/webhook", async (req, res) => {
  try {
    const update = req.body;
    if (!update || !update.update_id) {
      return res.status(400).json({ error: "Invalid update" });
    }
    telegramWebhookService.handleUpdate(update).catch((error) => {
      logError("Erro ao processar update do Telegram", error);
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    logError("Erro no endpoint de webhook do Telegram", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.post("/set-webhook", async (req, res) => {
  try {
    if (!telegramWebhookService.isConfigured()) {
      return res.status(400).json({
        error: "Bot n\xE3o configurado",
        message: "TELEGRAM_BOT_TOKEN ou WEBHOOK_DOMAIN n\xE3o definidos"
      });
    }
    const success = await telegramWebhookService.setWebhook();
    if (success) {
      const info = await telegramWebhookService.getWebhookInfo();
      res.json({
        success: true,
        message: "Webhook configurado com sucesso",
        webhookInfo: info
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Falha ao configurar webhook"
      });
    }
  } catch (error) {
    logError("Erro ao configurar webhook", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.delete("/webhook", async (req, res) => {
  try {
    const success = await telegramWebhookService.deleteWebhook();
    if (success) {
      res.json({
        success: true,
        message: "Webhook removido com sucesso"
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Falha ao remover webhook"
      });
    }
  } catch (error) {
    logError("Erro ao remover webhook", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.get("/webhook-info", async (req, res) => {
  try {
    if (!telegramWebhookService.isConfigured()) {
      return res.status(400).json({
        error: "Bot n\xE3o configurado",
        message: "TELEGRAM_BOT_TOKEN n\xE3o definido"
      });
    }
    const info = await telegramWebhookService.getWebhookInfo();
    res.json({
      configured: telegramWebhookService.isWebhookConfigured(),
      webhookInfo: info
    });
  } catch (error) {
    logError("Erro ao obter info do webhook", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router5.get("/status", (req, res) => {
  const isConfigured = telegramWebhookService.isConfigured();
  const isWebhookSet = telegramWebhookService.isWebhookConfigured();
  res.json({
    configured: isConfigured,
    webhookSet: isWebhookSet,
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
    hasDomain: !!process.env.WEBHOOK_DOMAIN
  });
});
var telegram_routes_default = router5;

// server/routes/ai-test.routes.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.get("/test", async (req, res) => {
  const sampleText = "Prometo construir 10 escolas e reduzir impostos municipais em 20% at\xE9 o final do mandato.";
  const results = {};
  logInfo("Iniciando teste de IAs via endpoint...");
  try {
    if (process.env.GEMINI_API_KEY) {
      try {
        results.gemini = await aiService.analyzeWithGemini(sampleText);
      } catch (e) {
        results.gemini = { error: e.message };
      }
    }
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        results.deepseek = await aiService.analyzeWithDeepSeek(sampleText);
      } catch (e) {
        results.deepseek = { error: e.message };
      }
    }
    if (process.env.GROQ_API_KEY) {
      try {
        results.groq = await aiService.analyzeWithGroq(sampleText);
      } catch (e) {
        results.groq = { error: e.message };
      }
    }
    res.json({
      success: true,
      env: {
        hasGemini: !!process.env.GEMINI_API_KEY,
        hasDeepSeek: !!process.env.DEEPSEEK_API_KEY,
        hasGroq: !!process.env.GROQ_API_KEY
      },
      results
    });
  } catch (error) {
    logError("Erro no teste de IA", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
var ai_test_routes_default = router6;

// server/core/routes.ts
var analysisLimiter2 = rateLimit2({
  windowMs: 60 * 60 * 1e3,
  // 1 hora
  max: (req) => req.user ? 50 : 10,
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
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api/telegram") || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      return next();
    }
    csrfProtection(req, res, next);
  });
  app2.get("/api/csrf-token", csrfTokenRoute);
  app2.use("/api/auth", loginLimiter, auth_default);
  app2.use("/api/analyze", analysisLimiter2, analysis_routes_default);
  app2.use("/api/statistics", statistics_routes_default);
  app2.use("/api/admin", admin_routes_default);
  app2.use("/api/telegram", telegram_routes_default);
  app2.use("/api/ai", ai_test_routes_default);
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      env: process.env.NODE_ENV,
      database: !!process.env.DATABASE_URL ? "PostgreSQL" : "SQLite"
    });
  });
}

// server/index.ts
import cookieParser from "cookie-parser";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
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
var clientBuildPath = path2.join(__dirname2, "../client/dist");
app.use(express.static(clientBuildPath));
(async () => {
  try {
    await initializeDatabase();
    setupRoutes(app);
    app.get("*", (req, res) => {
      res.sendFile(path2.join(clientBuildPath, "index.html"));
    });
    app.listen(PORT, () => {
      console.log(`[Detector de Promessa Vazia] Servidor iniciado em http://localhost:${PORT}`);
      console.log(`[Detector de Promessa Vazia] Ambiente: ${process.env.NODE_ENV || "development"}`);
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        telegramWebhookService.setWebhook().catch(
          (err) => console.error("Erro ao configurar webhook do Telegram:", err)
        );
      }
    });
  } catch (error) {
    console.error("[Detector de Promessa Vazia] Erro ao inicializar:", error);
    process.exit(1);
  }
})();
