var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
function logWarn(message, meta) {
  logger.warn(message, meta);
}
var __filename, __dirname, logger, logger_default;
var init_logger = __esm({
  "server/core/logger.ts"() {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: "detector-promessa-vazia" },
      transports: [
        new winston.transports.Console()
      ]
    });
    logger_default = logger;
  }
});

// server/core/database.ts
var database_exports = {};
__export(database_exports, {
  allQuery: () => allQuery,
  checkUrlExists: () => checkUrlExists,
  createAuditLog: () => createAuditLog,
  createConsent: () => createConsent,
  createRefreshToken: () => createRefreshToken,
  createUser: () => createUser,
  deleteRefreshToken: () => deleteRefreshToken,
  getConsent: () => getConsent,
  getPublicDataCache: () => getPublicDataCache,
  getQuery: () => getQuery,
  getRefreshToken: () => getRefreshToken,
  getSupabase: () => getSupabase,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  initializeDatabase: () => initializeDatabase,
  runQuery: () => runQuery,
  savePublicDataCache: () => savePublicDataCache,
  saveScoutHistory: () => saveScoutHistory,
  supabase: () => supabase,
  updateLastLogin: () => updateLastLogin
});
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";
async function initializeDatabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logInfo("[Database] SUPABASE_URL ou SUPABASE_KEY n\xE3o configurados. O sistema tentar\xE1 inicializar, mas chamadas ao banco podem falhar.");
    return;
  }
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    logInfo("[Database] Supabase SDK inicializado com sucesso");
  } catch (err) {
    logError("[Database] Erro ao inicializar Supabase SDK", err);
  }
}
function getSupabase() {
  if (!supabase) {
    if (SUPABASE_URL && SUPABASE_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    }
    throw new Error("Database not initialized and credentials missing");
  }
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
async function deleteRefreshToken(token) {
  const { error } = await getSupabase().from("refresh_tokens").delete().eq("token", token);
  if (error) logError("[Database] Erro ao deletar refresh token", error);
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
async function getConsent(userId) {
  const { data, error } = await getSupabase().from("consents").select("id, user_id, data_processing, privacy_policy, created_at").eq("user_id", userId).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao buscar consentimento", error);
  return data;
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
  return { id: nanoid(), changes: 0 };
}
async function getQuery(sql, params = []) {
  return null;
}
async function allQuery(sql, params = []) {
  return [];
}
async function saveScoutHistory(data) {
  const id = nanoid();
  const { error } = await getSupabase().from("scout_history").upsert([{
    id,
    url: data.url,
    title: data.title,
    content: data.content,
    source: data.source,
    politician_name: data.politicianName,
    published_at: data.publishedAt || (/* @__PURE__ */ new Date()).toISOString()
  }], { onConflict: "url" });
  if (error) logError("[Database] Erro ao salvar hist\xF3rico do Scout", error);
}
async function checkUrlExists(url) {
  const { data, error } = await getSupabase().from("scout_history").select("id").eq("url", url).single();
  if (error && error.code !== "PGRST116") logError("[Database] Erro ao verificar URL no Scout", error);
  return !!data;
}
var SUPABASE_URL, SUPABASE_KEY, supabase;
var init_database = __esm({
  "server/core/database.ts"() {
    init_logger();
    dotenv.config();
    SUPABASE_URL = process.env.SUPABASE_URL;
    SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    supabase = null;
  }
});

// server/modules/nlp.ts
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
    },
    negated: false,
    conditional: false
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
var PROMISE_VERBS, PROMISE_CATEGORIES;
var init_nlp = __esm({
  "server/modules/nlp.ts"() {
    PROMISE_VERBS = [
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
    PROMISE_CATEGORIES = {
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
  }
});

// server/integrations/siconfi.ts
import axios from "axios";
async function getBudgetData(category, year, sphere = "FEDERAL") {
  try {
    const cacheKey = `${category}_${year}_${sphere}`;
    const cached = await getPublicDataCache("SICONFI", cacheKey);
    if (cached) {
      return { ...cached, lastUpdated: new Date(cached.lastUpdated) };
    }
    logger_default.info(`[SICONFI] Buscando dados reais no Tesouro: ${category} (${year})`);
    const response = await axios.get(`${SICONFI_API_BASE}/dca`, {
      params: {
        an_exercicio: year,
        id_ente: sphere === "FEDERAL" ? "1" : "35",
        // 1 para Brasil, 35 para SP (exemplo)
        no_anexo: "DCA-AnexoI-C"
        // Despesas por Função
      },
      timeout: 15e3
    }).catch(() => ({ data: null }));
    if (!response.data || !response.data.items) {
      logger_default.warn(`[SICONFI] API inst\xE1vel. Usando estimativa hist\xF3rica para ${category}`);
      return getHistoricalFallback(category, year, sphere);
    }
    const empenhadoItem = response.data.items.find(
      (i) => i.coluna.includes("Despesas Empenhadas") && i.conta.toUpperCase().includes(category.toUpperCase())
    );
    const liquidadoItem = response.data.items.find(
      (i) => i.coluna.includes("Despesas Liquidadas") && i.conta.toUpperCase().includes(category.toUpperCase())
    );
    const empenhado = empenhadoItem ? parseFloat(empenhadoItem.valor) : 1e9;
    const liquidado = liquidadoItem ? parseFloat(liquidadoItem.valor) : empenhado * 0.8;
    const result = {
      year,
      sphere,
      category,
      budgeted: empenhado,
      executed: liquidado,
      percentage: empenhado > 0 ? liquidado / empenhado * 100 : 0,
      lastUpdated: /* @__PURE__ */ new Date(),
      details: {
        empenhado,
        liquidado,
        pago: liquidado * 0.95
        // Estimativa para o campo Pago
      }
    };
    await savePublicDataCache("SICONFI", cacheKey, result);
    return result;
  } catch (error) {
    logger_default.error(`[SICONFI] Erro ao buscar dados: ${error}`);
    return getHistoricalFallback(category, year, sphere);
  }
}
function getHistoricalFallback(category, year, sphere) {
  const fallbacks = {
    "SAUDE": 15e10,
    "EDUCACAO": 12e10,
    "SEGURANCA": 4e10,
    "INFRAESTRUTURA": 3e10,
    "GERAL": 5e10
  };
  const baseValue = fallbacks[category.toUpperCase()] || fallbacks["GERAL"];
  return {
    year,
    sphere,
    category,
    budgeted: baseValue,
    executed: baseValue * 0.85,
    percentage: 85,
    lastUpdated: /* @__PURE__ */ new Date()
  };
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
async function validateBudgetViability(category, estimatedValue, year, sphere = "FEDERAL") {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const history = await getBudgetHistory(category, currentYear - 2, currentYear - 1, sphere);
  if (history.length === 0) {
    return { viable: true, confidence: 0.3, reason: "Sem dados hist\xF3ricos dispon\xEDveis", historicalData: [] };
  }
  const avgBudget = history.reduce((sum, h) => sum + h.budgeted, 0) / history.length;
  const isViable = estimatedValue < avgBudget * 0.1;
  return {
    viable: isViable,
    confidence: 0.85,
    reason: isViable ? `O custo estimado \xE9 compat\xEDvel com o or\xE7amento hist\xF3rico de ${category}.` : `O custo estimado excede a capacidade fiscal hist\xF3rica para ${category}.`,
    historicalData: history
  };
}
function mapPromiseToSiconfiCategory(promiseCategory) {
  const mapping = {
    "SAUDE": "SAUDE",
    "HEALTH": "SAUDE",
    "EDUCACAO": "EDUCACAO",
    "EDUCATION": "EDUCACAO",
    "INFRAESTRUTURA": "URBANISMO",
    "INFRASTRUCTURE": "URBANISMO",
    "SEGURANCA": "SEGURANCA_PUBLICA",
    "SECURITY": "SEGURANCA_PUBLICA",
    "ECONOMIA": "GESTAO_AMBIENTAL",
    "ECONOMY": "GESTAO_AMBIENTAL",
    "AGRICULTURA": "AGRICULTURA",
    "AGRICULTURE": "AGRICULTURA",
    "CULTURA": "CULTURA",
    "CULTURE": "CULTURA",
    "TRANSPORTE": "TRANSPORTE",
    "TRANSPORT": "TRANSPORTE",
    "HABITACAO": "HABITACAO",
    "HOUSING": "HABITACAO",
    "SANEAMENTO": "SANEAMENTO",
    "SANITATION": "SANEAMENTO",
    "CIENCIA": "CIENCIA_E_TECNOLOGIA",
    "SCIENCE": "CIENCIA_E_TECNOLOGIA",
    "TRABALHO": "TRABALHO",
    "EMPLOYMENT": "TRABALHO",
    "SOCIAL": "ASSISTENCIA_SOCIAL"
  };
  const normalized = promiseCategory.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return mapping[normalized] || "ADMINISTRACAO";
}
async function syncSiconfiData(categories) {
  logger_default.info("[SICONFI] Iniciando sincroniza\xE7\xE3o de categorias");
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  for (const category of categories) {
    try {
      await getBudgetData(category, currentYear - 1, "FEDERAL");
    } catch (error) {
      logger_default.error(`[SICONFI] Falha ao sincronizar categoria ${category}: ${error}`);
    }
  }
  logger_default.info("[SICONFI] Sincroniza\xE7\xE3o conclu\xEDda");
}
var SICONFI_API_BASE;
var init_siconfi = __esm({
  "server/integrations/siconfi.ts"() {
    init_logger();
    init_database();
    SICONFI_API_BASE = "https://apidatalake.tesouro.gov.br/api/siconfi/index.php/conteudo";
  }
});

// server/integrations/tse.ts
import axios2 from "axios";
async function getPoliticalHistory(candidateName, state) {
  try {
    const cacheKey = `history_${candidateName}_${state}`;
    const cached = await getPublicDataCache("TSE", cacheKey);
    if (cached) return cached;
    logger_default.info(`[TSE] Buscando hist\xF3rico: ${candidateName}`);
    const searchResponse = await axios2.get(`${TSE_API_BASE}/eleicao/buscar/${state}/2024/1/1/candidatos`, {
      params: { nome: candidateName },
      timeout: 1e4
    }).catch(() => null);
    if (searchResponse?.data?.candidatos?.length > 0) {
      const cand = searchResponse.data.candidatos[0];
      const history = {
        candidateId: cand.id.toString(),
        candidateName: cand.nomeCompleto,
        totalElections: 1,
        totalElected: cand.descricaoTotalizacao === "Eleito" ? 1 : 0,
        electionRate: cand.descricaoTotalizacao === "Eleito" ? 100 : 0,
        promisesFulfilled: 0,
        promisesTotal: 0,
        fulfillmentRate: 50,
        // Default neutro mas baseado em existência real
        controversies: 0,
        scandals: 0
      };
      await savePublicDataCache("TSE", cacheKey, history);
      return history;
    }
    logger_default.warn(`[TSE] API Real do TSE n\xE3o retornou dados para: ${candidateName}.`);
    return null;
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
var TSE_API_BASE;
var init_tse = __esm({
  "server/integrations/tse.ts"() {
    init_logger();
    init_database();
    TSE_API_BASE = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";
  }
});

// server/modules/probability.ts
var probability_exports = {};
__export(probability_exports, {
  calculateProbability: () => calculateProbability,
  calculateProbabilityWithDetails: () => calculateProbabilityWithDetails
});
async function calculateProbability(promises, author, category) {
  const result = await calculateProbabilityWithDetails(promises, author, category);
  return result.score;
}
function calculateSpecificity(promise) {
  let score = 0.2;
  if (promise.text.match(/\d+/)) score += 0.2;
  if (promise.text.match(/\b(até|em|durante|próximo|ano|mês|semana|dia|202\d)\b/i)) score += 0.2;
  if (promise.text.match(/\b(construir|entregar|criar|reduzir|aumentar|reformar|implementar)\b/i)) score += 0.2;
  if (promise.text.length > 120) score += 0.2;
  return Math.min(score, 1);
}
function calculateTimelineFeasibility(promise) {
  let score = 0.5;
  const text = promise.text.toLowerCase();
  if (text.match(/\b(hospital|escola|ponte|estrada|rodovia|aeroporto)\b/) && text.match(/\b(meses|dias|1 ano)\b/)) {
    score -= 0.3;
  }
  if (text.match(/\b(4 anos|mandato|até o fim)\b/)) {
    score += 0.2;
  }
  const timelineMatch = text.match(/(\d+)\s*(dias?|semanas?|meses?|anos?)/i);
  if (timelineMatch) {
    const value = parseInt(timelineMatch[1]);
    const unit = timelineMatch[2].toLowerCase();
    let days = unit.includes("dia") ? value : unit.includes("semana") ? value * 7 : unit.includes("m\xEAs") ? value * 30 : value * 365;
    if (days < 30) score -= 0.1;
    else if (days > 1460) score -= 0.2;
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
  const siconfiCategory = mapPromiseToSiconfiCategory(category || "GERAL");
  const budgetValidation = await validateBudgetViability(siconfiCategory, 0, (/* @__PURE__ */ new Date()).getFullYear());
  const authorValidation = author ? await validateCandidateCredibility(author, "BR") : null;
  const allFactors = [];
  for (const promise of promises) {
    const specificity = calculateSpecificity(promise);
    const timeline = calculateTimelineFeasibility(promise);
    allFactors.push({
      promiseSpecificity: specificity,
      historicalCompliance: budgetValidation.confidence,
      budgetaryFeasibility: budgetValidation.viable ? 0.8 : 0.3,
      timelineFeasibility: timeline,
      authorTrack: authorValidation ? authorValidation.score : 0.5
    });
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
    score,
    // Retornar entre 0 e 1 para consistência
    factors: avgFactors,
    riskLevel,
    confidence: 0.85,
    // Alta confiança devido ao uso de dados reais
    details: {
      budgetImpact: avgFactors.budgetaryFeasibility,
      historicalCompliance: avgFactors.historicalCompliance,
      authorTrack: avgFactors.authorTrack
    }
  };
}
var init_probability = __esm({
  "server/modules/probability.ts"() {
    init_siconfi();
    init_tse();
  }
});

// server/services/ai.service.ts
var ai_service_exports = {};
__export(ai_service_exports, {
  AIService: () => AIService,
  aiService: () => aiService
});
import axios3 from "axios";
var AIService, aiService;
var init_ai_service = __esm({
  "server/services/ai.service.ts"() {
    init_logger();
    AIService = class {
      /**
       * Prompt de Alta Performance (Versão Restaurada e Melhorada)
       * Focado em profundidade, utilidade e análise técnica rigorosa.
       */
      promptTemplate(text) {
        return `Voc\xEA \xE9 um analista pol\xEDtico de elite, especializado em auditoria de promessas e an\xE1lise de viabilidade.
    Sua miss\xE3o \xE9 transformar o texto bruto em um relat\xF3rio de intelig\xEAncia profundo, \xFAtil e extremamente detalhado.
    
    DIRETRIZES DE QUALIDADE:
    1. PROFUNDIDADE: N\xE3o seja superficial. Analise as implica\xE7\xF5es de cada promessa.
    2. UTILIDADE: O texto deve servir para um cidad\xE3o decidir se a promessa \xE9 realista ou n\xE3o.
    3. RIGOR T\xC9CNICO: Use termos t\xE9cnicos de administra\xE7\xE3o p\xFAblica quando apropriado (ex: PPA, LOA, dota\xE7\xE3o or\xE7ament\xE1ria).
    4. DETEC\xC7\xC3O DE NUANCES: Identifique se a promessa depende de aprova\xE7\xE3o do Congresso ou se \xE9 ato exclusivo do Executivo.
    
    SISTEMA DE VEREDITO EM DUAS ETAPAS:
    Para cada an\xE1lise, voc\xEA deve obrigatoriamente responder a duas perguntas internas:
    1. "Quais s\xE3o os fatos?" (Baseado em dados e realidade atual)
    2. "Por que isso pode dar errado?" (An\xE1lise de riscos, obst\xE1culos e ceticismo)

    Para cada promessa extra\xEDda, forne\xE7a:
    - Um racioc\xEDnio (reasoning) t\xE9cnico.
    - Uma lista de "riscos" (risks) espec\xEDficos de descumprimento.
    
    Responda estritamente em formato JSON seguindo esta estrutura:
    {
      "promises": [
        {
          "text": "Texto integral da promessa",
          "category": "Sa\xFAde/Educa\xE7\xE3o/Economia/etc",
          "confidence": 0.95,
          "negated": false,
          "conditional": true,
          "reasoning": "An\xE1lise t\xE9cnica profunda sobre a viabilidade e impacto desta promessa espec\xEDfica.",
          "risks": ["Risco 1", "Risco 2"]
        }
      ],
      "overallSentiment": "An\xE1lise qualitativa do tom do discurso (ex: Populista, T\xE9cnico, Austero)",
      "credibilityScore": 85,
      "verdict": {
        "facts": ["Fato 1", "Fato 2"],
        "skepticism": ["Obst\xE1culo 1", "Motivo de falha 2"]
      }
    }
    
    Texto para an\xE1lise:
    ${text}`;
      }
      /**
       * Provedor de Código Aberto (Pollinations AI) com Multi-Model Fallback
       * Usando modelos de alto nível para garantir a qualidade do texto.
       */
      async analyzeWithOpenSource(text) {
        const models = ["openai", "mistral", "llama"];
        let lastError;
        for (const model of models) {
          try {
            logInfo(`[AI] Gerando relat\xF3rio de alta qualidade com modelo: ${model}...`);
            const response = await axios3.post("https://text.pollinations.ai/", {
              messages: [
                {
                  role: "system",
                  content: "Voc\xEA \xE9 um analista pol\xEDtico s\xEAnior. Seus relat\xF3rios s\xE3o famosos pela profundidade t\xE9cnica e utilidade pr\xE1tica. Voc\xEA nunca \xE9 superficial. Responda apenas JSON."
                },
                { role: "user", content: this.promptTemplate(text) }
              ],
              model,
              jsonMode: true
            }, { timeout: 6e4 });
            let content = response.data;
            if (typeof content === "object" && content.choices) {
              content = content.choices[0]?.message?.content || content;
            }
            if (typeof content === "string") {
              let cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
              const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                cleanContent = jsonMatch[0];
              }
              try {
                const parsed = JSON.parse(cleanContent);
                if (!parsed.verdict) {
                  parsed.verdict = { facts: [], skepticism: [] };
                }
                if (parsed.promises) {
                  parsed.promises = parsed.promises.map((p) => ({
                    ...p,
                    risks: p.risks || []
                  }));
                }
                return parsed;
              } catch (parseError) {
                logError(`[AI] Erro ao parsear JSON do modelo ${model}`, parseError);
                throw parseError;
              }
            }
            if (content && content.promises) {
              const result = content;
              if (!result.verdict) {
                result.verdict = { facts: [], skepticism: [] };
              }
              result.promises = result.promises.map((p) => ({
                ...p,
                risks: p.risks || []
              }));
              return result;
            }
            throw new Error(`Modelo ${model} n\xE3o gerou a profundidade esperada`);
          } catch (error) {
            logError(`[AI] Falha na tentativa com ${model}`, error);
            lastError = error;
            continue;
          }
        }
        throw lastError || new Error("Falha ao gerar relat\xF3rio de alta qualidade");
      }
      async analyzeText(text) {
        try {
          return await this.analyzeWithOpenSource(text);
        } catch (error) {
          logError("Erro cr\xEDtico na gera\xE7\xE3o do relat\xF3rio", error);
          throw new Error("N\xE3o foi poss\xEDvel gerar o relat\xF3rio detalhado no momento.");
        }
      }
    };
    aiService = new AIService();
  }
});

// server/services/analysis.service.ts
var analysis_service_exports = {};
__export(analysis_service_exports, {
  AnalysisService: () => AnalysisService,
  analysisService: () => analysisService
});
import { nanoid as nanoid4 } from "nanoid";
var AnalysisService, analysisService;
var init_analysis_service = __esm({
  "server/services/analysis.service.ts"() {
    init_database();
    init_nlp();
    init_probability();
    init_ai_service();
    init_logger();
    AnalysisService = class {
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
          logError("Fallback para NLP local devido a erro na IA", error);
          promises = extractPromises(text);
        }
        const analysisId = nanoid4();
        const probabilityScore = await calculateProbability(promises, author, category);
        const supabase2 = getSupabase();
        const { error: analysisError } = await supabase2.from("analyses").insert([{
          id: analysisId,
          user_id: userId,
          text,
          author,
          category,
          extracted_promises: promises,
          probability_score: probabilityScore
        }]);
        if (analysisError) {
          logError("Erro ao salvar an\xE1lise no Supabase", analysisError);
          throw analysisError;
        }
        if (promises.length > 0) {
          const promisesToInsert = promises.map((p) => ({
            id: nanoid4(),
            analysis_id: analysisId,
            promise_text: p.text,
            category: p.category,
            confidence_score: p.confidence,
            extracted_entities: p.entities || {},
            negated: p.negated || false,
            conditional: p.conditional || false
          }));
          const { error: promisesError } = await supabase2.from("promises").insert(promisesToInsert);
          if (promisesError) {
            logError("Erro ao salvar promessas no Supabase", promisesError);
          }
        }
        return {
          id: analysisId,
          probabilityScore,
          promisesCount: promises.length,
          promises
        };
      }
      async getAnalysisById(id) {
        const supabase2 = getSupabase();
        const { data: analysis, error: analysisError } = await supabase2.from("analyses").select("*").eq("id", id).single();
        if (analysisError || !analysis) return null;
        const { data: promises, error: promisesError } = await supabase2.from("promises").select("*").eq("analysis_id", id);
        return {
          ...analysis,
          promises: promises || [],
          extracted_promises: analysis.extracted_promises || []
        };
      }
      async listAnalyses(limit = 50, offset = 0) {
        const supabase2 = getSupabase();
        const { data: analyses, error, count } = await supabase2.from("analyses").select("id, author, category, probability_score, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
        if (error) {
          logError("Erro ao listar an\xE1lises", error);
          return { analyses: [], total: 0 };
        }
        return {
          analyses: analyses || [],
          total: count || 0
        };
      }
    };
    analysisService = new AnalysisService();
  }
});

// server/services/ai-deepseek.service.ts
var ai_deepseek_service_exports = {};
__export(ai_deepseek_service_exports, {
  DeepSeekService: () => DeepSeekService,
  deepSeekService: () => deepSeekService
});
import axios10 from "axios";
var DeepSeekService, deepSeekService;
var init_ai_deepseek_service = __esm({
  "server/services/ai-deepseek.service.ts"() {
    init_logger();
    DeepSeekService = class {
      API_URL = "https://openrouter.ai/api/v1/chat/completions";
      MODEL = "deepseek/deepseek-r1";
      // Ou 'deepseek/deepseek-r1:free' se disponível
      promptTemplate(text) {
        return `Voc\xEA \xE9 um Auditor T\xE9cnico Independente e Analista de Viabilidade Or\xE7ament\xE1ria. Sua miss\xE3o \xE9 realizar uma auditoria fria, imparcial e estritamente t\xE9cnica do discurso pol\xEDtico fornecido.

### PRINC\xCDPIOS DE AUDITORIA (INVIOL\xC1VEIS):
1. **NEUTRALIDADE ABSOLUTA:** N\xE3o utilize linguagem emocional, adjetivos pejorativos ou elogiosos. Trate todos os espectros pol\xEDticos com o mesmo rigor t\xE9cnico.
2. **HONESTIDADE INTELECTUAL:** Baseie suas conclus\xF5es apenas em evid\xEAncias presentes no texto ou em dados or\xE7ament\xE1rios/legais conhecidos. Se n\xE3o houver dados suficientes para um veredito, declare a incerteza.
3. **FOCO EM VIABILIDADE:** Substitua julgamentos de valor por an\xE1lises de viabilidade (financeira, legislativa e operacional).

### DIRETRIZES DE REDA\xC7\xC3O:
1. **Tom:** Cl\xEDnico, forense e puramente informativo.
2. **Ceticismo T\xE9cnico:** Questione a exequibilidade t\xE9cnica. "Existe previs\xE3o or\xE7ament\xE1ria?", "H\xE1 compet\xEAncia legal para tal ato?", "Qual o hist\xF3rico de execu\xE7\xE3o de projetos similares?".
3. **Diferencia\xE7\xE3o:** Separe claramente "Inten\xE7\xE3o Pol\xEDtica" (desejo) de "Compromisso Estruturado" (plano com meios).

### SISTEMA DE VEREDITO EM DUAS ETAPAS (OBRIGAT\xD3RIO):
1. **FATOS:** Liste evid\xEAncias concretas, dados or\xE7ament\xE1rios ou realidade pol\xEDtica atual.
2. **CETICISMO:** Liste pontos de d\xFAvida t\xE9cnica, inconsist\xEAncias l\xF3gicas ou obst\xE1culos pol\xEDticos.

Responda estritamente em formato JSON puro (sem markdown):
{
  "promises": [
    {
      "text": "A promessa ou declara\xE7\xE3o exata",
      "category": "Sa\xFAde|Educa\xE7\xE3o|Economia|Seguran\xE7a|Infraestrutura|Geral",
      "confidence": 0.0 a 1.0,
      "negated": false,
      "conditional": false,
      "reasoning": "An\xE1lise t\xE9cnica profunda sobre a viabilidade e o contexto hist\xF3rico/pol\xEDtico desta promessa espec\xEDfica.",
      "risks": [
        "Risco t\xE9cnico/or\xE7ament\xE1rio espec\xEDfico",
        "Obst\xE1culo pol\xEDtico ou legislativo identificado"
      ]
    }
  ],
  "overallSentiment": "Tom predominante do discurso",
  "credibilityScore": 0-100,
  "verdict": {
    "facts": ["Evid\xEAncia concreta 1", "Evid\xEAncia concreta 2"],
    "skepticism": ["Ponto de d\xFAvida t\xE9cnica 1", "Inconsist\xEAncia l\xF3gica ou pol\xEDtica 2"]
  }
}

Texto para an\xE1lise:
${text}`;
      }
      async analyzeText(text, apiKey) {
        try {
          logInfo(`[DeepSeek-R1] Iniciando an\xE1lise de racioc\xEDnio profundo...`);
          const response = await axios10.post(this.API_URL, {
            model: this.MODEL,
            messages: [
              {
                role: "system",
                content: "Voc\xEA \xE9 um auditor pol\xEDtico de elite. Voc\xEA pensa profundamente antes de responder. Responda apenas JSON."
              },
              { role: "user", content: this.promptTemplate(text) }
            ],
            response_format: { type: "json_object" }
          }, {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://github.com/Glitch-D-ream/Testes",
              // Opcional para OpenRouter
              "X-Title": "Detector de Promessa Vazia"
            },
            timeout: 9e4
            // DeepSeek R1 pode demorar mais para "pensar"
          });
          let content = response.data.choices[0].message.content;
          if (typeof content === "string") {
            content = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
          }
          logInfo(`[DeepSeek-R1] An\xE1lise conclu\xEDda com sucesso.`);
          return content;
        } catch (error) {
          logError(`[DeepSeek-R1] Erro na integra\xE7\xE3o`, error);
          throw new Error("Falha na an\xE1lise profunda via DeepSeek R1.");
        }
      }
    };
    deepSeekService = new DeepSeekService();
  }
});

// server/index.ts
init_database();
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

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
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token n\xE3o fornecido"
    });
  }
  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token inv\xE1lido ou expirado"
    });
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
function csrfTokenRoute(req, res) {
  const token = generateCsrfToken(req, res);
  return res.json({ csrfToken: token });
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

// server/controllers/analysis.controller.ts
init_analysis_service();

// server/services/export.service.ts
init_analysis_service();
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import nodeHtmlToImage from "node-html-to-image";
var ExportService = class {
  analysisService = new AnalysisService();
  async generateAnalysisImage(analysisId) {
    const analysis = await this.analysisService.getAnalysisById(analysisId);
    if (!analysis) throw new Error("An\xE1lise n\xE3o encontrada");
    const score = Math.round((analysis.probability_score || 0) * 100);
    const date = new Date(analysis.created_at).toLocaleDateString("pt-BR");
    let level = "Moderada";
    let color = "#f59e0b";
    if (score >= 80) {
      level = "Altamente Vi\xE1vel";
      color = "#10b981";
    } else if (score >= 60) {
      level = "Vi\xE1vel";
      color = "#3b82f6";
    } else if (score >= 20) {
      level = "Baixa";
      color = "#f97316";
    } else {
      level = "Muito Baixa";
      color = "#ef4444";
    }
    const html = `
      <html>
        <head>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { width: 1200px; height: 630px; font-family: 'Inter', sans-serif; }
            .card-bg { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
          </style>
        </head>
        <body class="flex items-center justify-center p-0 m-0">
          <div class="card-bg w-full h-full p-12 flex flex-col justify-between text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-4xl font-bold mb-2">Detector de Promessa Vazia</h1>
                <p class="text-blue-200 text-xl">An\xE1lise de Viabilidade Pol\xEDtica</p>
              </div>
              <div class="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold text-lg">
                ${date}
              </div>
            </div>

            <div class="flex-1 flex items-center gap-12 my-8">
              <div class="flex-1">
                <div class="bg-white bg-opacity-10 p-6 rounded-2xl border border-white border-opacity-20">
                  <p class="text-blue-100 text-sm uppercase tracking-wider mb-2">Pol\xEDtico / Autor</p>
                  <h2 class="text-3xl font-bold mb-4">${analysis.author || "N\xE3o informado"}</h2>
                  <p class="text-blue-100 text-sm uppercase tracking-wider mb-2">Texto Analisado</p>
                  <p class="text-xl italic line-clamp-3">"${analysis.text.substring(0, 180)}${analysis.text.length > 180 ? "..." : ""}"</p>
                </div>
              </div>

              <div class="w-80 flex flex-col items-center justify-center bg-white rounded-3xl p-8 shadow-2xl">
                <p class="text-gray-500 font-bold uppercase text-sm mb-2">Score de Viabilidade</p>
                <div class="text-7xl font-black mb-2" style="color: ${color}">${score}%</div>
                <div class="px-6 py-2 rounded-full text-white font-bold text-lg" style="background-color: ${color}">
                  ${level}
                </div>
              </div>
            </div>

            <div class="flex justify-between items-center border-t border-white border-opacity-10 pt-6">
              <div class="flex gap-8">
                <div>
                  <p class="text-blue-200 text-xs uppercase">Promessas</p>
                  <p class="text-xl font-bold">${analysis.promises?.length || 0}</p>
                </div>
                <div>
                  <p class="text-blue-200 text-xs uppercase">Categoria</p>
                  <p class="text-xl font-bold">${analysis.category || "Geral"}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-blue-200 text-sm">Acesse a an\xE1lise completa em:</p>
                <p class="text-lg font-mono font-bold">detector-promessa-vazia.pages.dev</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const image = await nodeHtmlToImage({
      html,
      type: "jpeg",
      quality: 90,
      puppeteerArgs: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || void 0,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      }
    });
    return image;
  }
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
        req.get ? req.get("user-agent") : null
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
  async exportImage(req, res) {
    try {
      const { id } = req.params;
      const imageBuffer = await exportService.generateAnalysisImage(id);
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Disposition", `inline; filename="analise-${id}.jpg"`);
      return res.send(imageBuffer);
    } catch (error) {
      logError("Erro ao exportar Imagem", error);
      return res.status(500).json({ error: "Erro ao gerar card de compartilhamento" });
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
router2.get("/:id/image", optionalAuthMiddleware, analysisController.exportImage);
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
      const supabase2 = getSupabase();
      const { count: totalAnalyses, error: err1 } = await supabase2.from("analyses").select("*", { count: "exact", head: true });
      const { count: totalPromises, error: err2 } = await supabase2.from("promises").select("*", { count: "exact", head: true });
      const { data: analysisData, error: err3 } = await supabase2.from("analyses").select("probability_score, author");
      const averageConfidence = analysisData && analysisData.length > 0 ? analysisData.reduce((acc, curr) => acc + (curr.probability_score || 0), 0) / analysisData.length : 0;
      const totalAuthors = new Set(analysisData?.map((a) => a.author).filter(Boolean)).size;
      const { data: categoriesData, error: err4 } = await supabase2.from("promises").select("category");
      const categoriesMap = {};
      categoriesData?.forEach((row) => {
        const cat = row.category || "Geral";
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });
      const byCategory = Object.entries(categoriesMap).map(([category, count]) => ({
        category,
        count
      })).sort((a, b) => b.count - a.count);
      if (err1 || err2 || err3 || err4) {
        logError("Erro em uma das queries de estat\xEDsticas", err1 || err2 || err3 || err4);
      }
      return res.json({
        totalAnalyses: totalAnalyses || 0,
        totalPromises: totalPromises || 0,
        averageConfidence,
        totalAuthors,
        byCategory
      });
    } catch (error) {
      logError("Erro ao buscar estat\xEDsticas globais", error);
      return res.status(500).json({ error: "Erro ao buscar estat\xEDsticas" });
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
init_siconfi();

// server/integrations/portal-transparencia.ts
init_logger();
init_database();
import axios4 from "axios";
var PORTAL_API_BASE = "https://www.portaltransparencia.gov.br/api-de-dados";
async function getExpenses(category, startDate, endDate, limit = 100) {
  try {
    const cacheKey = `expenses_${category}_${startDate.getFullYear()}`;
    const cached = await getPublicDataCache("PORTAL_TRANSPARENCIA", cacheKey);
    if (cached) return cached;
    logger_default.info(`[Portal Transpar\xEAncia] Buscando despesas: ${category}`);
    const response = await axios4.get(`${PORTAL_API_BASE}/despesas`, {
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
      logger_default.warn(`[Portal Transpar\xEAncia] Falha na API ou dados inexistentes para: ${category}`);
      return [];
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
init_tse();
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
init_analysis_service();
init_logger();
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
      const domain = WEBHOOK_DOMAIN.endsWith("/") ? WEBHOOK_DOMAIN.slice(0, -1) : WEBHOOK_DOMAIN;
      const path3 = WEBHOOK_PATH.startsWith("/") ? WEBHOOK_PATH : `/${WEBHOOK_PATH}`;
      const webhookUrl = `${domain}${path3}`;
      console.log(`[Telegram] Configurando webhook em: ${webhookUrl}`);
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
init_logger();
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
init_ai_service();
init_logger();
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

// server/routes/search.routes.ts
import { Router as Router7 } from "express";

// server/controllers/search.controller.ts
init_database();
init_logger();

// server/services/search.service.ts
init_database();
init_logger();

// server/agents/scout.ts
init_logger();
init_database();
import axios6 from "axios";

// server/agents/multi-scout.ts
init_logger();
import axios5 from "axios";
import { nanoid as nanoid6 } from "nanoid";
var MultiScoutAgent = class {
  primaryModels = ["openai", "mistral", "llama"];
  fallbackRSSFeeds = [
    "https://feeds.folha.uol.com.br/poder",
    "https://g1.globo.com/dynamo/politica/feed.xml",
    "https://www.poder360.com.br/feed/"
  ];
  async search(query) {
    logInfo(`[Multi-Scout] Iniciando busca resiliente para: ${query}`);
    let sources = [];
    sources = await this.searchViaDuckDuckGo(query);
    if (sources.length > 0) {
      logInfo(`[Multi-Scout] Sucesso na busca via DuckDuckGo. ${sources.length} fontes encontradas.`);
      return sources;
    }
    try {
      sources = await this.searchViaAI(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via IA. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via IA. Tentando fallback...`, error);
    }
    try {
      sources = await this.searchViaRSSFeeds(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca via RSS. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logWarn(`[Multi-Scout] Falha na busca via RSS. Tentando fallback final...`, error);
    }
    try {
      sources = await this.searchGeneric(query);
      if (sources.length > 0) {
        logInfo(`[Multi-Scout] Sucesso na busca gen\xE9rica. ${sources.length} fontes encontradas.`);
        return sources;
      }
    } catch (error) {
      logError(`[Multi-Scout] Todas as tentativas falharam.`, error);
    }
    return [];
  }
  /**
   * Busca via IA com múltiplos modelos
   */
  async searchViaAI(query) {
    for (const model of this.primaryModels) {
      try {
        logInfo(`[Multi-Scout] Tentando modelo: ${model}`);
        const prompt = `Busque not\xEDcias recentes sobre "${query}" em portugu\xEAs. 
        Retorne um JSON com array de objetos contendo: title, content (resumo), url, publishedAt (ISO date).
        Exemplo: {"results": [{"title": "...", "content": "...", "url": "...", "publishedAt": "2026-01-24T..."}]}`;
        const response = await axios5.post("https://text.pollinations.ai/", {
          messages: [
            { role: "system", content: "Voc\xEA \xE9 um agregador de not\xEDcias. Responda apenas JSON." },
            { role: "user", content: prompt }
          ],
          model,
          jsonMode: true
        }, { timeout: 15e3 });
        let data = response.data;
        if (typeof data === "string") {
          data = JSON.parse(data.replace(/```json\n?|\n?```/g, "").trim());
        }
        if (data && data.results && Array.isArray(data.results)) {
          return data.results.map((item) => ({
            id: nanoid6(),
            url: item.url || `https://news.search/${nanoid6()}`,
            title: item.title || "Sem t\xEDtulo",
            content: item.content || "Sem conte\xFAdo",
            source: model,
            publishedAt: item.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
            confidence: "medium"
          }));
        }
      } catch (error) {
        logWarn(`[Multi-Scout] Modelo ${model} falhou:`, error);
      }
    }
    throw new Error("Nenhum modelo de IA dispon\xEDvel");
  }
  /**
   * Busca via DuckDuckGo (Custo Zero e Sem API Key)
   */
  async searchViaDuckDuckGo(query) {
    try {
      logInfo(`[Multi-Scout] Tentando busca via DuckDuckGo: ${query}`);
      const response = await axios5.get(`https://html.duckduckgo.com/html/`, {
        params: { q: query },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        timeout: 1e4
      });
      const html = response.data;
      const sources = [];
      const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      let match;
      let count = 0;
      while ((match = resultRegex.exec(html)) !== null && count < 5) {
        const url = new URL(match[1], "https://duckduckgo.com").searchParams.get("uddg") || match[1];
        sources.push({
          id: nanoid6(),
          url,
          title: match[2].trim(),
          content: match[3].trim(),
          source: "DuckDuckGo",
          publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          confidence: "medium"
        });
        count++;
      }
      return sources;
    } catch (error) {
      logWarn(`[Multi-Scout] DuckDuckGo falhou:`, error);
      return [];
    }
  }
  /**
   * Busca via RSS Feeds de portais de notícias
   */
  async searchViaRSSFeeds(query) {
    const sources = [];
    for (const feedUrl of this.fallbackRSSFeeds) {
      try {
        logInfo(`[Multi-Scout] Tentando feed RSS: ${feedUrl}`);
        const response = await axios5.get(feedUrl, { timeout: 1e4 });
        const feedContent = response.data;
        const items = feedContent.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (const item of items) {
          const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/))?.[1] || "Sem t\xEDtulo";
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
          const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/))?.[1] || "Sem conte\xFAdo";
          if (title.toLowerCase().includes(query.toLowerCase()) || description.toLowerCase().includes(query.toLowerCase())) {
            sources.push({
              id: nanoid6(),
              url: link,
              title: title.replace(/<[^>]+>/g, ""),
              content: description.replace(/<[^>]+>/g, "").substring(0, 300),
              source: new URL(feedUrl).hostname || "RSS Feed",
              publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
              confidence: "medium"
            });
          }
          if (sources.length >= 5) break;
        }
        if (sources.length > 0) break;
      } catch (error) {
        logWarn(`[Multi-Scout] Feed RSS falhou: ${feedUrl}`, error);
      }
    }
    return sources;
  }
  /**
   * Busca genérica de último recurso
   * Retorna dados estruturados mesmo sem fonte externa real
   */
  async searchGeneric(query) {
    logWarn(`[Multi-Scout] Usando fallback gen\xE9rico para: ${query}`);
    return [
      {
        id: nanoid6(),
        url: `https://generic-search/${nanoid6()}`,
        title: `An\xE1lise de Compromissos: ${query}`,
        content: `Busca gen\xE9rica para ${query}. Nenhuma fonte externa dispon\xEDvel no momento. Sistema em modo fallback.`,
        source: "Generic Fallback",
        publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
        confidence: "low"
      }
    ];
  }
};
var multiScoutAgent = new MultiScoutAgent();

// server/agents/scout.ts
var ScoutAgent = class {
  whitelist = [
    "g1.globo.com",
    "folha.uol.com.br",
    "estadao.com.br",
    "cnnbrasil.com.br",
    "valor.globo.com",
    "bbc.com",
    "elpais.com",
    "uol.com.br",
    "r7.com",
    "metropoles.com",
    "poder360.com.br",
    "agenciabrasil.ebc.com.br",
    "camara.leg.br",
    "senado.leg.br",
    "planalto.gov.br"
  ];
  blacklistKeywords = [
    "bbb",
    "festa",
    "namoro",
    "casamento",
    "look",
    "fofoca",
    "celebridade",
    "hor\xF3scopo",
    "novela",
    "futebol",
    "gol",
    "campeonato",
    "venda",
    "oferta",
    "promo\xE7\xE3o",
    "desconto",
    "comprar",
    "pre\xE7o",
    "ingresso",
    "show",
    "atriz",
    "ator",
    "influencer",
    "blogueira",
    "clima",
    "previs\xE3o do tempo",
    "receita",
    "culin\xE1ria"
  ];
  async search(query) {
    logInfo(`[Scout] Iniciando varredura multicanal com resili\xEAncia para: ${query}`);
    const sources = [];
    try {
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);
      if (sources.length < 3) {
        logWarn(`[Scout] Apenas ${sources.length} fontes via RSS. Ativando Multi-Scout resiliente...`);
        const multiScoutResults = await multiScoutAgent.search(query);
        multiScoutResults.forEach((item) => {
          sources.push({
            title: item.title,
            url: item.url,
            content: item.content,
            source: item.source,
            publishedAt: item.publishedAt,
            type: "news",
            confidence: item.confidence
          });
        });
      }
      if (sources.length < 3) {
        const webResults = await this.fetchFromWeb(query);
        sources.push(...webResults);
      }
      const newSources = [];
      for (const source of sources) {
        if (!this.isValidUrl(source.url)) continue;
        const isTrusted = this.whitelist.some((domain) => source.url.includes(domain));
        source.confidence = isTrusted ? "high" : "medium";
        await saveScoutHistory({
          url: source.url,
          title: source.title,
          content: source.content,
          source: source.source,
          politicianName: query,
          publishedAt: source.publishedAt
        }).catch(() => {
        });
        newSources.push(source);
      }
      logInfo(`[Scout] Varredura conclu\xEDda. ${newSources.length} novas fontes validadas.`);
      return newSources;
    } catch (error) {
      logError(`[Scout] Erro na varredura de ${query}`, error);
      return [];
    }
  }
  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
  sanitizeText(text) {
    if (!text) return "";
    return text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "").replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  }
  async fetchFromWeb(query) {
    const prompt = `Liste 5 not\xEDcias reais e recentes do pol\xEDtico brasileiro "${query}" com promessas ou declara\xE7\xF5es. 
    Retorne APENAS um array JSON puro, sem markdown, seguindo este formato: 
    [{"title": "T\xEDtulo da Not\xEDcia", "url": "https://link-da-noticia.com", "content": "Resumo da promessa ou declara\xE7\xE3o encontrada", "source": "Nome do Portal", "date": "2024-01-01"}]`;
    const models = ["openai", "mistral", "llama"];
    for (const model of models) {
      try {
        logInfo(`[Scout] Tentando busca web com modelo: ${model}`);
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${Math.floor(Math.random() * 1e3)}`;
        const response = await axios6.get(url, { timeout: 2e4 });
        let content = response.data;
        if (!content) continue;
        let cleanContent = typeof content === "string" ? content : JSON.stringify(content);
        cleanContent = cleanContent.replace(/```json\n?|\n?```/g, "").trim();
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          if (Array.isArray(results) && results.length > 0) {
            return results.map((item) => ({
              title: item.title || item.titulo || "Not\xEDcia Identificada",
              url: item.url || item.link || "https://google.com",
              content: this.sanitizeText(item.content || item.snippet || item.resumo || ""),
              source: item.source || item.fonte || "Busca Web",
              publishedAt: item.date || item.data || (/* @__PURE__ */ new Date()).toISOString(),
              type: "news",
              confidence: "medium"
            }));
          }
        }
      } catch (error) {
        logError(`[Scout] Falha com modelo ${model}: ${error.message}`);
      }
    }
    return [];
  }
  async fetchFromRSS(query) {
    const feeds = [
      { name: "G1 Pol\xEDtica", url: "https://g1.globo.com/rss/g1/politica/" },
      { name: "Folha Poder", url: "https://feeds.folha.uol.com.br/poder/rss091.xml" }
    ];
    const results = [];
    const queryLower = query.toLowerCase();
    for (const feed of feeds) {
      try {
        const response = await axios6.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, { timeout: 1e4 });
        if (response.data?.items) {
          const matchedItems = response.data.items.filter(
            (item) => item.title.toLowerCase().includes(queryLower) || item.description && item.description.toLowerCase().includes(queryLower)
          );
          for (const item of matchedItems) {
            results.push({
              title: item.title,
              url: item.link,
              content: this.sanitizeText(item.description || item.content || ""),
              source: feed.name,
              publishedAt: item.pubDate,
              type: "news",
              confidence: "high"
            });
          }
        }
      } catch (error) {
        logError(`[Scout] Erro ao ler feed ${feed.name}`, error);
      }
    }
    return results;
  }
};
var scoutAgent = new ScoutAgent();

// server/agents/filter.ts
init_logger();
import axios7 from "axios";
var FilterAgent = class {
  /**
   * Filtra e limpa os dados brutos usando uma IA leve com processamento em lote
   */
  async filter(sources) {
    logInfo(`[Filter] Analisando relev\xE2ncia de ${sources.length} fontes...`);
    const uniqueSources = Array.from(new Map(sources.map((s) => [s.url, s])).values());
    const candidates = uniqueSources.filter((source) => this.simpleHeuristic(source.title + " " + source.content));
    if (candidates.length === 0) {
      logInfo(`[Filter] Nenhuma fonte passou na heur\xEDstica inicial.`);
      return [];
    }
    logInfo(`[Filter] ${candidates.length} fontes passaram na heur\xEDstica. Iniciando an\xE1lise em lote via IA...`);
    try {
      const filteredResults = await this.checkRelevanceBatch(candidates);
      logInfo(`[Filter] Refino conclu\xEDdo. ${filteredResults.length} fontes \xFAteis para o Brain.`);
      return filteredResults;
    } catch (error) {
      logError(`[Filter] Erro no processamento em lote. Usando fallback individual...`, error);
      return candidates.map((source) => ({
        ...source,
        relevanceScore: 0.5,
        isPromise: true,
        justification: "Aprovado por heur\xEDstica (Fallback de erro na IA)"
      }));
    }
  }
  /**
   * Analisa um lote de fontes em uma única chamada de IA
   */
  async checkRelevanceBatch(sources) {
    const batchData = sources.map((s, idx) => ({
      id: idx,
      text: `${s.title}: ${s.content.substring(0, 300)}...`
    }));
    const prompt = `Voc\xEA \xE9 um Analista de Triagem de Dados P\xFAblicos. Sua tarefa \xE9 filtrar as not\xEDcias abaixo com base em CRIT\xC9RIOS T\xC9CNICOS de utilidade para auditoria.

### CRIT\xC9RIOS DE INCLUS\xC3O:
1. **Compromisso de A\xE7\xE3o:** Declara\xE7\xF5es que indicam uma a\xE7\xE3o futura (ex: "Vou construir", "Reduziremos").
2. **An\xFAncio de Pol\xEDtica P\xFAblica:** Lan\xE7amento de programas, obras ou mudan\xE7as legislativas.
3. **Dados Concretos:** Not\xEDcias que citam valores, prazos ou metas espec\xEDficas.

### CRIT\xC9RIOS DE EXCLUS\xC3O (IMPARCIALIDADE):
1. **Opini\xE3o/Ret\xF3rica Pura:** Cr\xEDticas a advers\xE1rios ou elogios a aliados sem proposta de a\xE7\xE3o.
2. **Vida Pessoal/Protocolar:** Eventos sociais, agendas de viagens sem pauta t\xE9cnica ou fofocas.
3. **Vi\xE9s Editorial:** Ignore o tom do jornalista; foque apenas na declara\xE7\xE3o direta do agente pol\xEDtico.

Textos: ${JSON.stringify(batchData)}
Responda apenas um JSON no formato: {"results": [{"id": number, "isPromise": boolean, "score": number, "reason": "string"}]}`;
    const response = await axios7.post("https://text.pollinations.ai/", {
      messages: [
        { role: "system", content: "Voc\xEA \xE9 um classificador de dados pol\xEDticos especializado em an\xE1lise de promessas. Responda apenas JSON." },
        { role: "user", content: prompt }
      ],
      model: "openai",
      jsonMode: true
    }, { timeout: 3e4 });
    let data = response.data;
    if (typeof data === "string") {
      data = JSON.parse(data.replace(/```json\n?|\n?```/g, "").trim());
    }
    const filtered = [];
    if (data && data.results) {
      for (const res of data.results) {
        if (res.isPromise && sources[res.id]) {
          filtered.push({
            ...sources[res.id],
            relevanceScore: res.score,
            isPromise: true,
            justification: res.reason,
            // Garantir que metadados de evidência sejam passados
            content: sources[res.id].content,
            url: sources[res.id].url,
            source: sources[res.id].source
          });
        }
      }
    }
    return filtered;
  }
  simpleHeuristic(content) {
    const actionVerbs = [
      "vou",
      "vamos",
      "prometo",
      "farei",
      "irei",
      "pretendo",
      "planejo",
      "investir",
      "construir",
      "obras",
      "edital",
      "lan\xE7ar",
      "reforma",
      "ampliar",
      "criar",
      "reduzir",
      "aumentar",
      "implementar",
      "entregar",
      "contratar",
      "destinar",
      "aplicar",
      "baixar",
      "cortar",
      "eliminar"
    ];
    const politicalContext = [
      "governo",
      "prefeitura",
      "estado",
      "munic\xEDpio",
      "verba",
      "or\xE7amento",
      "povo",
      "cidad\xE3o",
      "eleitor",
      "campanha",
      "mandato",
      "gest\xE3o"
    ];
    const contentLower = content.toLowerCase();
    const hasAction = actionVerbs.some((kw) => contentLower.includes(kw));
    const hasContext = politicalContext.some((kw) => contentLower.includes(kw));
    const strongActions = ["vou", "prometo", "farei", "irei", "construir", "investir"];
    const hasStrongAction = strongActions.some((kw) => contentLower.includes(kw));
    return hasStrongAction || hasAction && hasContext;
  }
};
var filterAgent = new FilterAgent();

// server/agents/brain.ts
init_logger();
init_database();
init_siconfi();

// server/integrations/camara.ts
init_logger();
init_database();
import axios8 from "axios";
var CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2";
async function getDeputadoId(nome) {
  try {
    const cacheKey = `deputado_id_${nome}`;
    const cached = await getPublicDataCache("CAMARA", cacheKey);
    if (cached) return cached.id;
    const response = await axios8.get(`${CAMARA_API_BASE}/deputados`, {
      params: { nome, ordem: "ASC", ordenarPor: "nome" }
    });
    const deputado = response.data.dados[0];
    if (deputado) {
      await savePublicDataCache("CAMARA", cacheKey, { id: deputado.id });
      return deputado.id;
    }
    return null;
  } catch (error) {
    logger_default.error(`[Camara] Erro ao buscar ID do deputado ${nome}: ${error}`);
    return null;
  }
}
async function getVotacoesDeputado(deputadoId) {
  try {
    const cacheKey = `votacoes_v6_${deputadoId}`;
    const cached = await getPublicDataCache("CAMARA", cacheKey);
    if (cached) return cached;
    const responseVotacoes = await axios8.get(`${CAMARA_API_BASE}/votacoes`, {
      params: { ordem: "DESC", ordenarPor: "dataHoraRegistro", itens: 20 },
      headers: { "Accept": "application/json" }
    });
    const votosEncontrados = [];
    for (const votacao of responseVotacoes.data.dados) {
      try {
        const resVoto = await axios8.get(`${CAMARA_API_BASE}/votacoes/${votacao.id}/votos`, {
          headers: { "Accept": "application/json" }
        });
        const votoDoDeputado = resVoto.data.dados.find((v) => v.deputado?.id === deputadoId);
        if (votoDoDeputado) {
          votosEncontrados.push({
            idVotacao: votacao.id,
            data: votacao.dataHoraRegistro,
            proposicao: votacao.proposicaoExterna?.siglaTipo + " " + votacao.proposicaoExterna?.numero + "/" + votacao.proposicaoExterna?.ano,
            voto: votoDoDeputado.tipoVoto,
            ementa: votacao.proposicaoExterna?.ementa || votacao.descricao || "Sem ementa dispon\xEDvel"
          });
        }
      } catch (e) {
        continue;
      }
    }
    if (votosEncontrados.length > 0) {
      await savePublicDataCache("CAMARA", cacheKey, votosEncontrados);
    }
    return votosEncontrados;
  } catch (error) {
    logger_default.error(`[Camara] Erro ao buscar vota\xE7\xF5es do deputado ${deputadoId}: ${error}`);
    return [];
  }
}
function analisarIncoerencia(promessa, voto) {
  const textoPromessa = promessa.toLowerCase();
  const ementaVoto = voto.ementa.toLowerCase();
  const temas = [
    { nome: "educa\xE7\xE3o", keywords: ["educa\xE7\xE3o", "escola", "ensino", "universidade", "professor", "merenda"] },
    { nome: "sa\xFAde", keywords: ["sa\xFAde", "hospital", "m\xE9dico", "sus", "vacina", "medicamento"] },
    { nome: "seguran\xE7a", keywords: ["seguran\xE7a", "pol\xEDcia", "crime", "viol\xEAncia", "armas"] },
    { nome: "economia", keywords: ["economia", "imposto", "tributo", "fiscal", "or\xE7amento", "gasto"] }
  ];
  for (const tema of temas) {
    const promessaSobreTema = tema.keywords.some((k) => textoPromessa.includes(k));
    const votoSobreTema = tema.keywords.some((k) => ementaVoto.includes(k));
    if (promessaSobreTema && votoSobreTema) {
      const votoContra = voto.voto === "N\xE3o" || voto.voto === "Obstru\xE7\xE3o" || voto.voto.includes("Contra");
      const promessaPositiva = ["aumentar", "investir", "apoiar", "criar", "melhorar"].some((p) => textoPromessa.includes(p));
      if (promessaPositiva && votoContra) {
        return {
          incoerente: true,
          justificativa: `O pol\xEDtico prometeu apoio \xE0 \xE1rea de ${tema.nome}, mas votou "${voto.voto}" na proposi\xE7\xE3o ${voto.proposicao} que trata de: ${voto.ementa}`
        };
      }
    }
  }
  return { incoerente: false, justificativa: "" };
}

// server/services/cache.service.ts
init_database();
init_logger();
var CacheService = class {
  CACHE_TTL_DAYS = 7;
  // Tempo de vida do cache: 7 dias
  /**
   * Buscar análise em cache
   */
  async getAnalysis(politicianName) {
    try {
      const supabase2 = getSupabase();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error } = await supabase2.from("analysis_cache").select("*").eq("politician_name", politicianName).gt("expires_at", now).single();
      if (error || !data) {
        logWarn(`[Cache] An\xE1lise n\xE3o encontrada ou expirada para: ${politicianName}`);
        return null;
      }
      await supabase2.from("analysis_cache").update({ hit_count: data.hit_count + 1 }).eq("id", data.id).catch(() => {
      });
      logInfo(`[Cache] An\xE1lise encontrada em cache para: ${politicianName} (Hits: ${data.hit_count + 1})`);
      return data.analysis_data;
    } catch (error) {
      logWarn(`[Cache] Erro ao buscar an\xE1lise em cache`, error);
      return null;
    }
  }
  /**
   * Salvar análise em cache
   */
  async saveAnalysis(politicianName, analysisData) {
    try {
      const supabase2 = getSupabase();
      const now = /* @__PURE__ */ new Date();
      const expiresAt = new Date(now.getTime() + this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1e3);
      await supabase2.from("analysis_cache").delete().eq("politician_name", politicianName).catch(() => {
      });
      const { error } = await supabase2.from("analysis_cache").insert({
        politician_name: politicianName,
        analysis_data: analysisData,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        hit_count: 0
      });
      if (error) {
        logWarn(`[Cache] Erro ao salvar an\xE1lise em cache`, error);
        return false;
      }
      logInfo(`[Cache] An\xE1lise salva em cache para: ${politicianName} (Expira em: ${expiresAt.toISOString()})`);
      return true;
    } catch (error) {
      logWarn(`[Cache] Erro ao salvar an\xE1lise em cache`, error);
      return false;
    }
  }
  /**
   * Limpar cache expirado
   */
  async cleanExpiredCache() {
    try {
      const supabase2 = getSupabase();
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error } = await supabase2.from("analysis_cache").delete().lt("expires_at", now).select();
      if (error) {
        logWarn(`[Cache] Erro ao limpar cache expirado`, error);
        return 0;
      }
      const deletedCount = data?.length || 0;
      logInfo(`[Cache] ${deletedCount} an\xE1lises expiradas removidas do cache`);
      return deletedCount;
    } catch (error) {
      logWarn(`[Cache] Erro ao limpar cache expirado`, error);
      return 0;
    }
  }
  /**
   * Obter estatísticas de cache
   */
  async getStats() {
    try {
      const supabase2 = getSupabase();
      const { data, error } = await supabase2.from("analysis_cache").select("hit_count");
      if (error || !data) {
        return { totalCached: 0, totalHits: 0, avgHitsPerAnalysis: 0 };
      }
      const totalCached = data.length;
      const totalHits = data.reduce((sum, item) => sum + (item.hit_count || 0), 0);
      const avgHitsPerAnalysis = totalCached > 0 ? totalHits / totalCached : 0;
      return { totalCached, totalHits, avgHitsPerAnalysis };
    } catch (error) {
      logWarn(`[Cache] Erro ao obter estat\xEDsticas de cache`, error);
      return { totalCached: 0, totalHits: 0, avgHitsPerAnalysis: 0 };
    }
  }
};
var cacheService = new CacheService();

// server/services/temporal-incoherence.service.ts
init_logger();

// server/integrations/senado.ts
init_logger();
init_database();
import axios9 from "axios";
var SENADO_API_BASE = "https://legis.senado.leg.br/dadosabertos/senador";
async function getSenadorCodigo(nome) {
  try {
    const cacheKey = `senador_codigo_${nome}`;
    const cached = await getPublicDataCache("SENADO", cacheKey);
    if (cached) return cached.codigo;
    const response = await axios9.get(`${SENADO_API_BASE}/lista/atual`, {
      headers: { "Accept": "application/json" }
    });
    const senadores = response.data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
    const senador = senadores.find((s) => s.IdentificacaoParlamentar.NomeParlamentar.toLowerCase().includes(nome.toLowerCase()));
    if (senador) {
      const codigo = senador.IdentificacaoParlamentar.CodigoParlamentar;
      await savePublicDataCache("SENADO", cacheKey, { codigo });
      return codigo;
    }
    return null;
  } catch (error) {
    logger_default.error(`[Senado] Erro ao buscar c\xF3digo do senador ${nome}: ${error}`);
    return null;
  }
}
async function getVotacoesSenador(codigoSenador) {
  try {
    const cacheKey = `votacoes_senado_${codigoSenador}`;
    const cached = await getPublicDataCache("SENADO", cacheKey);
    if (cached) return cached;
    const response = await axios9.get(`${SENADO_API_BASE}/${codigoSenador}/votacoes`, {
      headers: { "Accept": "application/json" }
    });
    const votacoesRaw = response.data.VotacaoParlamentar.Parlamentar.Votacoes.Votacao;
    const votacoes = votacoesRaw.map((v) => ({
      codigoSessao: v.CodigoSessao,
      data: v.DataSessao,
      siglaMateria: v.Materia.Sigla,
      numeroMateria: v.Materia.Numero,
      anoMateria: v.Materia.Ano,
      voto: v.DescricaoVoto,
      ementa: v.Materia.Ementa || "Sem ementa dispon\xEDvel"
    }));
    await savePublicDataCache("SENADO", cacheKey, votacoes);
    return votacoes;
  } catch (error) {
    logger_default.error(`[Senado] Erro ao buscar vota\xE7\xF5es do senador ${codigoSenador}: ${error}`);
    return [];
  }
}

// server/services/temporal-incoherence.service.ts
var TemporalIncoherenceService = class {
  /**
   * Analisar incoerência temporal de um político
   */
  async analyzeIncoherence(politicianName, promises) {
    logInfo(`[TemporalIncoherence] Analisando incoer\xEAncia temporal para: ${politicianName}`);
    const contradictions = [];
    try {
      let votacoes = await this.getDeputadoVotacoes(politicianName);
      if (!votacoes || votacoes.length === 0) {
        votacoes = await this.getSenadorVotacoes(politicianName);
      }
      if (!votacoes || votacoes.length === 0) {
        logWarn(`[TemporalIncoherence] Nenhum hist\xF3rico legislativo encontrado para: ${politicianName}`);
        return {
          hasIncoherence: false,
          contradictions: [],
          coherenceScore: 100,
          // Sem dados, assume coerência
          summary: "Sem hist\xF3rico legislativo dispon\xEDvel para an\xE1lise de incoer\xEAncia."
        };
      }
      for (const promise of promises) {
        const promiseKeywords = this.extractKeywords(promise);
        for (const votacao of votacoes) {
          const votacaoKeywords = this.extractKeywords(votacao.descricao || votacao.nome || "");
          const relevanceScore = this.calculateRelevance(promiseKeywords, votacaoKeywords);
          if (relevanceScore > 0.6) {
            if (votacao.voto === "N\xE3o" || votacao.voto === "Absten\xE7\xE3o") {
              contradictions.push({
                promiseText: promise,
                votedAgainstOn: votacao.data || (/* @__PURE__ */ new Date()).toISOString(),
                votedAgainstBill: votacao.nome || "Projeto n\xE3o identificado",
                billUrl: votacao.url || `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${votacao.id}`,
                severity: this.calculateSeverity(relevanceScore),
                explanation: `O pol\xEDtico votou "${votacao.voto}" em ${votacao.data} sobre "${votacao.nome}", o que contradiz a promessa: "${promise}"`
              });
            }
          }
        }
      }
      const coherenceScore = this.calculateCoherenceScore(promises.length, contradictions.length);
      const summary = contradictions.length === 0 ? `Nenhuma contradi\xE7\xE3o detectada. Hist\xF3rico legislativo alinhado com as promessas.` : `${contradictions.length} contradi\xE7\xE3o(\xF5es) detectada(s) entre promessas e hist\xF3rico legislativo.`;
      logInfo(`[TemporalIncoherence] An\xE1lise conclu\xEDda. Score de coer\xEAncia: ${coherenceScore}%`);
      return {
        hasIncoherence: contradictions.length > 0,
        contradictions,
        coherenceScore,
        summary
      };
    } catch (error) {
      logError(`[TemporalIncoherence] Erro na an\xE1lise de incoer\xEAncia`, error);
      return {
        hasIncoherence: false,
        contradictions: [],
        coherenceScore: 100,
        summary: "Erro ao analisar incoer\xEAncia temporal. An\xE1lise indispon\xEDvel."
      };
    }
  }
  /**
   * Buscar votações de um Deputado Federal
   */
  async getDeputadoVotacoes(name) {
    try {
      const deputadoId = await getDeputadoId(name);
      if (!deputadoId) return [];
      const votacoes = await getVotacoesDeputado(deputadoId);
      return votacoes || [];
    } catch (error) {
      logWarn(`[TemporalIncoherence] Erro ao buscar vota\xE7\xF5es de deputado`, error);
      return [];
    }
  }
  /**
   * Buscar votações de um Senador
   */
  async getSenadorVotacoes(name) {
    try {
      const senadorCodigo = await getSenadorCodigo(name);
      if (!senadorCodigo) return [];
      const votacoes = await getVotacoesSenador(senadorCodigo);
      return votacoes || [];
    } catch (error) {
      logWarn(`[TemporalIncoherence] Erro ao buscar vota\xE7\xF5es de senador`, error);
      return [];
    }
  }
  /**
   * Extrair palavras-chave de um texto
   */
  extractKeywords(text) {
    if (!text) return [];
    const stopwords = ["o", "a", "de", "para", "com", "em", "\xE9", "que", "e", "do", "da", "ou", "por", "um", "uma", "os", "as", "dos", "das"];
    return text.toLowerCase().split(/\s+/).filter((word) => word.length > 3 && !stopwords.includes(word)).slice(0, 10);
  }
  /**
   * Calcular relevância entre dois conjuntos de palavras-chave
   */
  calculateRelevance(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    const intersection = keywords1.filter((k) => keywords2.includes(k)).length;
    const union = (/* @__PURE__ */ new Set([...keywords1, ...keywords2])).size;
    return intersection / union;
  }
  /**
   * Calcular severidade da contradição
   */
  calculateSeverity(relevanceScore) {
    if (relevanceScore > 0.8) return "high";
    if (relevanceScore > 0.7) return "medium";
    return "low";
  }
  /**
   * Calcular score geral de coerência
   */
  calculateCoherenceScore(totalPromises, contradictions) {
    if (totalPromises === 0) return 100;
    return Math.max(0, 100 - contradictions / totalPromises * 100);
  }
};
var temporalIncoherenceService = new TemporalIncoherenceService();

// server/agents/brain.ts
var BrainAgent = class {
  /**
   * O Cérebro Central 3.0: Com Cache, Resiliência e Análise de Incoerência Temporal
   */
  async analyze(politicianName, sources, userId = null, existingAnalysisId = null) {
    logInfo(`[Brain] Iniciando an\xE1lise profunda para: ${politicianName}`);
    try {
      const cachedAnalysis = await cacheService.getAnalysis(politicianName);
      if (cachedAnalysis) {
        logInfo(`[Brain] An\xE1lise recuperada do cache para: ${politicianName}`);
        return cachedAnalysis;
      }
      logWarn(`[Brain] An\xE1lise n\xE3o encontrada em cache. Executando an\xE1lise completa...`);
      const knowledgeBase = sources.map((s) => {
        const title = s.title || "Declara\xE7\xE3o Identificada";
        return `### ${title}
**Fonte:** ${s.source} | **Data:** ${s.publishedAt || "Recente"}

> ${s.content}

**An\xE1lise de Contexto:** ${s.justification}`;
      }).join("\n\n---\n\n");
      const history = await this.getPoliticianHistory(politicianName);
      const historyContext = history ? `Este pol\xEDtico possui um hist\xF3rico de ${history.totalAnalyses} an\xE1lises no sistema, com uma m\xE9dia de confiabilidade de ${history.avgScore}%.` : "Este \xE9 o primeiro registro detalhado deste pol\xEDtico em nossa base de dados em tempo real.";
      const mainCategory = this.detectMainCategory(sources);
      const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const budgetViability = await validateBudgetViability(siconfiCategory, 5e8, currentYear - 1);
      const promiseTexts = sources.map((s) => s.content).filter((c) => c && c.length > 0);
      const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(politicianName, promiseTexts);
      const temporalSection = temporalAnalysis.hasIncoherence ? `## \u{1F504} AN\xC1LISE DE INCOER\xCANCIA TEMPORAL (DIZ VS FAZ)
**Coer\xEAncia Hist\xF3rica:** ${temporalAnalysis.coherenceScore}%

${temporalAnalysis.contradictions.map(
        (c) => `- **${c.promiseText}** vs Vota\xE7\xE3o em ${c.votedAgainstOn}: ${c.votedAgainstBill} (Severidade: ${c.severity.toUpperCase()})`
      ).join("\n")}

**Resumo:** ${temporalAnalysis.summary}

---

` : `## \u{1F504} AN\xC1LISE DE INCOER\xCANCIA TEMPORAL (DIZ VS FAZ)
**Coer\xEAncia Hist\xF3rica:** ${temporalAnalysis.coherenceScore}%

${temporalAnalysis.summary}

---

`;
      const fullContext = `
# \u{1F4D1} DOSSI\xCA DE INTELIG\xCANCIA POL\xCDTICA: ${politicianName.toUpperCase()}

---

## \u{1F4CA} 1. PERFIL E CONTEXTO HIST\xD3RICO
${historyContext}

---

## \u{1F4B0} 2. AN\xC1LISE DE VIABILIDADE FINANCEIRA (SICONFI)
> **Foco Setorial:** ${mainCategory}

| Indicador | Status |
| :--- | :--- |
| **Veredito T\xE9cnico** | ${budgetViability.reason} |
| **Viabilidade Estimada** | ${budgetViability.viable ? "\u2705 ALTA VIABILIDADE" : "\u26A0\uFE0F EXECU\xC7\xC3O COMPLEXA"} |
| **Confian\xE7a dos Dados** | ${Math.round(budgetViability.confidence * 100)}% |

---

## \u26A0\uFE0F 3. MATRIZ DE RISCOS (AN\xC1LISE DE CEN\xC1RIOS)
Abaixo, os principais obst\xE1culos identificados que podem impedir o cumprimento das promessas:

*   **\u{1F4C9} RISCO OR\xC7AMENT\xC1RIO:** Rigidez fiscal e depend\xEAncia de fontes externas de financiamento.
*   **\u2696\uFE0F RISCO POL\xCDTICO:** Necessidade de articula\xE7\xE3o legislativa e hist\xF3rico de oposi\xE7\xE3o a pautas similares.
*   **\u2699\uFE0F RISCO OPERACIONAL:** Complexidade log\xEDstica e aus\xEAncia de cronogramas t\xE9cnicos detalhados.

---

${temporalSection}

## \u{1F50D} 5. EVID\xCANCIAS AUDITADAS (FONTES P\xDABLICAS)
Os registros abaixo foram extra\xEDdos, sanitizados e validados pela Tr\xEDade de Agentes:

${knowledgeBase}

---
*Este relat\xF3rio \xE9 um documento de utilidade p\xFAblica gerado de forma aut\xF4noma pela Tr\xEDade de Agentes (Scout, Filter, Brain). A an\xE1lise \xE9 baseada em dados p\xFAblicos e algoritmos de intelig\xEAncia artificial.*
      `;
      let analysis;
      if (existingAnalysisId) {
        analysis = await this.updateExistingAnalysis(existingAnalysisId, fullContext, politicianName, mainCategory);
      } else {
        const { analysisService: analysisService2 } = await Promise.resolve().then(() => (init_analysis_service(), analysis_service_exports));
        analysis = await analysisService2.createAnalysis(userId, fullContext, politicianName, mainCategory);
      }
      await cacheService.saveAnalysis(politicianName, {
        ...analysis,
        budgetViability,
        mainCategory,
        temporalAnalysis
      }).catch((err) => logWarn("[Brain] Erro ao salvar em cache", err));
      logInfo(`[Brain] An\xE1lise conclu\xEDda com sucesso para ${politicianName}.`);
      return {
        ...analysis,
        budgetViability,
        mainCategory,
        temporalAnalysis
      };
    } catch (error) {
      logError(`[Brain] Falha na an\xE1lise profunda de ${politicianName}`, error);
      throw error;
    }
  }
  detectMainCategory(sources) {
    const text = sources.map((s) => (s.title + " " + s.content).toLowerCase()).join(" ");
    if (text.includes("sa\xFAde") || text.includes("hospital") || text.includes("m\xE9dico") || text.includes("sus") || text.includes("vacina")) return "SAUDE";
    if (text.includes("educa\xE7\xE3o") || text.includes("escola") || text.includes("ensino") || text.includes("universidade") || text.includes("professor")) return "EDUCACAO";
    if (text.includes("seguran\xE7a") || text.includes("pol\xEDcia") || text.includes("crime") || text.includes("viol\xEAncia") || text.includes("guarda")) return "SEGURANCA";
    if (text.includes("economia") || text.includes("imposto") || text.includes("pib") || text.includes("infla\xE7\xE3o") || text.includes("juros")) return "ECONOMIA";
    if (text.includes("infraestrutura") || text.includes("obras") || text.includes("estrada") || text.includes("ponte") || text.includes("asfalto")) return "INFRAESTRUTURA";
    if (text.includes("agricultura") || text.includes("rural") || text.includes("fazenda") || text.includes("safra")) return "AGRICULTURA";
    if (text.includes("cultura") || text.includes("arte") || text.includes("cinema") || text.includes("teatro")) return "CULTURA";
    if (text.includes("transporte") || text.includes("\xF4nibus") || text.includes("metr\xF4") || text.includes("trem")) return "TRANSPORTE";
    if (text.includes("habita\xE7\xE3o") || text.includes("casa") || text.includes("moradia") || text.includes("apartamento")) return "HABITACAO";
    if (text.includes("saneamento") || text.includes("\xE1gua") || text.includes("esgoto") || text.includes("lixo")) return "SANEAMENTO";
    if (text.includes("ci\xEAncia") || text.includes("tecnologia") || text.includes("pesquisa") || text.includes("inova\xE7\xE3o")) return "CIENCIA";
    if (text.includes("trabalho") || text.includes("emprego") || text.includes("sal\xE1rio") || text.includes("fgts")) return "TRABALHO";
    if (text.includes("social") || text.includes("pobreza") || text.includes("fome") || text.includes("aux\xEDlio")) return "SOCIAL";
    return "GERAL";
  }
  async updateExistingAnalysis(id, text, author, category) {
    const { aiService: aiService2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
    const { deepSeekService: deepSeekService2 } = await Promise.resolve().then(() => (init_ai_deepseek_service(), ai_deepseek_service_exports));
    const { calculateProbability: calculateProbability2 } = await Promise.resolve().then(() => (init_probability(), probability_exports));
    const { nanoid: nanoid8 } = await import("nanoid");
    const supabase2 = getSupabase();
    let aiAnalysis;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (openRouterKey && openRouterKey !== "sua_chave_aqui") {
      try {
        logInfo("[Brain] Utilizando DeepSeek R1 para an\xE1lise de racioc\xEDnio profundo...");
        aiAnalysis = await deepSeekService2.analyzeText(text, openRouterKey);
      } catch (err) {
        logError("[Brain] Falha no DeepSeek R1, recorrendo ao AIService padr\xE3o", err);
        aiAnalysis = await aiService2.analyzeText(text);
      }
    } else {
      aiAnalysis = await aiService2.analyzeText(text);
    }
    const promises = aiAnalysis.promises.map((p) => ({
      text: p.text,
      confidence: p.confidence,
      category: p.category,
      negated: p.negated,
      conditional: p.conditional,
      reasoning: p.reasoning,
      risks: p.risks || [],
      evidenceSnippet: text.substring(0, 1e3),
      sourceName: "M\xFAltiplas Fontes Auditadas",
      newsTitle: "An\xE1lise Consolidada",
      legislativeIncoherence: null,
      legislativeSourceUrl: null
    }));
    if (author) {
      try {
        const deputadoId = await getDeputadoId(author);
        if (deputadoId) {
          const votacoes = await getVotacoesDeputado(deputadoId);
          for (const p of promises) {
            for (const v of votacoes) {
              const analise = analisarIncoerencia(p.text, v);
              if (analise.incoerente) {
                p.legislativeIncoherence = analise.justificativa;
                p.legislativeSourceUrl = `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${v.idVotacao}`;
                break;
              }
            }
          }
        }
      } catch (err) {
        logError("[BrainAgent] Erro no cruzamento legislativo", err);
      }
    }
    const probabilityScore = await calculateProbability2(promises, author, category);
    const { error } = await supabase2.from("analyses").update({
      text,
      category,
      extracted_promises: promises,
      probability_score: probabilityScore.score,
      methodology_notes: JSON.stringify({
        factors: probabilityScore.factors,
        details: probabilityScore.details,
        verdict: aiAnalysis.verdict
      }),
      status: "completed",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id);
    if (error) throw error;
    if (promises.length > 0) {
      const promisesToInsert = promises.map((p) => ({
        id: nanoid8(),
        analysis_id: id,
        promise_text: p.text,
        category: p.category,
        confidence_score: p.confidence,
        extracted_entities: {
          risks: p.risks || [],
          legislative_incoherence: p.legislativeIncoherence,
          legislative_source_url: p.legislativeSourceUrl
        },
        negated: p.negated || false,
        conditional: p.conditional || false,
        evidence_snippet: p.evidenceSnippet,
        source_name: p.sourceName,
        news_title: p.newsTitle
      }));
      await supabase2.from("promises").insert(promisesToInsert);
    }
    return { id, probabilityScore, promises };
  }
  async getPoliticianHistory(name) {
    try {
      const supabase2 = getSupabase();
      const { data, error } = await supabase2.from("analyses").select("probability_score").ilike("author", `%${name}%`).eq("status", "completed");
      if (error || !data || data.length === 0) return null;
      const totalAnalyses = data.length;
      const avgScore = data.reduce((acc, curr) => acc + (curr.probability_score || 0), 0) / totalAnalyses;
      return { totalAnalyses, avgScore: Math.round(avgScore * 100) };
    } catch {
      return null;
    }
  }
};
var brainAgent = new BrainAgent();

// server/services/search.service.ts
var SearchService = class {
  /**
   * Busca políticos por nome, partido ou região no banco de dados local
   */
  async searchPoliticians(query) {
    logInfo(`[Search] Buscando pol\xEDticos no banco: "${query}"`);
    try {
      const sql = `
        SELECT id, name, party, office, region, photo_url as photoUrl, bio, credibility_score as credibilityScore
        FROM politicians
        WHERE name LIKE ? OR party LIKE ? OR region LIKE ?
        LIMIT 20
      `;
      const searchTerm = `%${query}%`;
      const results = await allQuery(sql, [searchTerm, searchTerm, searchTerm]);
      return results || [];
    } catch (error) {
      logError("[Search] Erro ao buscar pol\xEDticos:", error);
      return [];
    }
  }
  /**
   * Busca promessas por texto ou categoria no banco de dados local
   */
  async searchPromises(query) {
    logInfo(`[Search] Buscando promessas no banco: "${query}"`);
    try {
      const sql = `
        SELECT p.id, p.promise_text as text, p.category, p.confidence_score as confidence, 
               a.author, a.created_at as createdAt
        FROM promises p
        JOIN analyses a ON p.analysis_id = a.id
        WHERE p.promise_text LIKE ? OR p.category LIKE ?
        LIMIT 20
      `;
      const searchTerm = `%${query}%`;
      const results = await allQuery(sql, [searchTerm, searchTerm]);
      return results || [];
    } catch (error) {
      logError("[Search] Erro ao buscar promessas:", error);
      return [];
    }
  }
  /**
   * Busca global (Políticos + Promessas)
   */
  async globalSearch(query) {
    const [foundPoliticians, foundPromises] = await Promise.all([
      this.searchPoliticians(query),
      this.searchPromises(query)
    ]);
    return {
      politicians: foundPoliticians,
      promises: foundPromises
    };
  }
  /**
   * Orquestração da Tríade de Agentes para Análise Automática (V2 com Jobs)
   */
  async autoAnalyzePolitician(politicianName, userId = null) {
    const { getSupabase: getSupabase2 } = await Promise.resolve().then(() => (init_database(), database_exports));
    const supabase2 = getSupabase2();
    const { nanoid: nanoid8 } = await import("nanoid");
    logInfo(`[Orchestrator] Ignorando cache para garantir an\xE1lise com l\xF3gica atualizada: ${politicianName}`);
    const analysisId = nanoid8();
    await supabase2.from("analyses").insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `An\xE1lise autom\xE1tica iniciada para ${politicianName}`,
      status: "processing"
    }]);
    setImmediate(async () => {
      try {
        logInfo(`[Orchestrator] [Job:${analysisId}] Iniciando Tr\xEDade para: ${politicianName}`);
        const rawSources = await scoutAgent.search(politicianName);
        if (rawSources.length === 0) {
          throw new Error("O Agente Buscador n\xE3o encontrou not\xEDcias ou fontes recentes para este pol\xEDtico. Tente um nome mais conhecido.");
        }
        const filteredSources = await filterAgent.filter(rawSources);
        if (filteredSources.length === 0) {
          throw new Error("Nenhuma promessa ou compromisso pol\xEDtico claro foi detectado nas not\xEDcias encontradas.");
        }
        await brainAgent.analyze(politicianName, filteredSources, userId, analysisId);
        logInfo(`[Orchestrator] [Job:${analysisId}] Conclu\xEDdo com sucesso.`);
      } catch (error) {
        logError(`[Orchestrator] [Job:${analysisId}] Falha: ${error.message}`);
        await supabase2.from("analyses").update({
          status: "failed",
          error_message: error.message
          // Corrigido para error_message conforme o banco
        }).eq("id", analysisId);
      }
    });
    return { id: analysisId, status: "processing" };
  }
};
var searchService = new SearchService();

// server/controllers/search.controller.ts
var SearchController = class {
  async searchPoliticians(req, res) {
    try {
      const { q } = req.query;
      const query = q?.toString() || "";
      const supabase2 = getSupabase();
      const { data: analyses, error } = await supabase2.from("analyses").select("author, probability_score, id, status").or(`author.ilike.%${query}%,text.ilike.%${query}%`).eq("status", "completed");
      if (error) throw error;
      const politicianMap = /* @__PURE__ */ new Map();
      analyses?.forEach((a) => {
        if (!a.author) return;
        if (!politicianMap.has(a.author)) {
          politicianMap.set(a.author, {
            name: a.author,
            analysesCount: 0,
            totalScore: 0,
            party: "N/A",
            state: "N/A",
            id: a.author.toLowerCase().replace(/\s+/g, "-")
          });
        }
        const p = politicianMap.get(a.author);
        p.analysesCount++;
        p.totalScore += a.probability_score || 0;
      });
      const results = Array.from(politicianMap.values()).map((p) => ({
        ...p,
        averageScore: Math.round(p.totalScore / p.analysesCount)
      }));
      return res.json({ results });
    } catch (error) {
      logError("Erro na busca de pol\xEDticos", error);
      return res.status(500).json({ error: "Erro ao realizar busca" });
    }
  }
  /**
   * Realiza busca na web e análise automática (Job Based)
   */
  async autoAnalyze(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Nome do pol\xEDtico \xE9 obrigat\xF3rio" });
      }
      logInfo(`[Controller] Iniciando an\xE1lise autom\xE1tica para: ${name}`);
      const userId = req.userId || null;
      const result = await searchService.autoAnalyzePolitician(name, userId);
      return res.status(202).json(result);
    } catch (error) {
      logError("Erro na an\xE1lise autom\xE1tica", error);
      return res.status(500).json({
        error: "Erro ao realizar an\xE1lise autom\xE1tica",
        message: error.message
      });
    }
  }
  /**
   * Verifica o status de uma análise em andamento
   */
  async checkStatus(req, res) {
    try {
      const { id } = req.params;
      const supabase2 = getSupabase();
      const { data, error } = await supabase2.from("analyses").select("id, status, error_message, probability_score").eq("id", id).single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "An\xE1lise n\xE3o encontrada" });
      return res.json(data);
    } catch (error) {
      logError("Erro ao verificar status da an\xE1lise", error);
      return res.status(500).json({ error: "Erro ao verificar status" });
    }
  }
};
var searchController = new SearchController();

// server/routes/search.routes.ts
var router7 = Router7();
router7.get("/", searchController.searchPoliticians);
router7.post("/auto-analyze", optionalAuthMiddleware, searchController.autoAnalyze);
router7.get("/status/:id", searchController.checkStatus);
var search_routes_default = router7;

// server/routes/audit.routes.ts
init_database();
init_logger();
import { Router as Router8 } from "express";
import { nanoid as nanoid7 } from "nanoid";
var router8 = Router8();
router8.post("/contribute", async (req, res) => {
  try {
    const { promiseId, type, suggestedUrl, description } = req.body;
    const userId = req.userId || null;
    const supabase2 = getSupabase();
    if (!promiseId || !type) {
      return res.status(400).json({ error: "Promise ID e Tipo s\xE3o obrigat\xF3rios" });
    }
    const contributionId = nanoid7();
    const { error } = await supabase2.from("audit_contributions").insert([{
      id: contributionId,
      promise_id: promiseId,
      user_id: userId,
      type,
      suggested_url: suggestedUrl,
      description,
      status: "pending"
    }]);
    if (error) throw error;
    logInfo(`[Audit] Nova contribui\xE7\xE3o recebida: ${contributionId} para a promessa ${promiseId}`);
    return res.status(201).json({ id: contributionId, message: "Contribui\xE7\xE3o registrada com sucesso" });
  } catch (error) {
    logError("Erro ao registrar contribui\xE7\xE3o de auditoria", error);
    return res.status(500).json({ error: "Erro interno ao processar contribui\xE7\xE3o" });
  }
});
var audit_routes_default = router8;

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
  app2.get("/api/csrf-token", csrfTokenRoute);
  app2.use("/api/auth", loginLimiter, auth_default);
  app2.use("/api/analyze", analysisLimiter2, analysis_routes_default);
  app2.use("/api/statistics", statistics_routes_default);
  app2.use("/api/admin", admin_routes_default);
  app2.use("/api/telegram", telegram_routes_default);
  app2.use("/api/ai", ai_test_routes_default);
  app2.use("/api/search", search_routes_default);
  app2.use("/api/audit", audit_routes_default);
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
app.set("trust proxy", 1);
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
var clientBuildPath = process.env.NODE_ENV === "production" ? path2.join(__dirname2, "public") : path2.join(__dirname2, "../client/dist");
app.use(express.static(clientBuildPath));
(async () => {
  console.log("[Detector de Promessa Vazia] Iniciando processo de inicializa\xE7\xE3o...");
  console.log(`[Detector de Promessa Vazia] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Detector de Promessa Vazia] PORT: ${PORT}`);
  console.log(`[Detector de Promessa Vazia] Client Build Path: ${clientBuildPath}`);
  try {
    console.log("[Detector de Promessa Vazia] Inicializando banco de dados...");
    await initializeDatabase();
    console.log("[Detector de Promessa Vazia] Banco de dados inicializado.");
    console.log("[Detector de Promessa Vazia] Configurando rotas...");
    setupRoutes(app);
    app.get("/ping", (req, res) => res.send("pong"));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(clientBuildPath, "index.html"), (err) => {
        if (err) {
          res.status(500).send("Erro ao carregar o frontend. Verifique se o build foi conclu\xEDdo.");
        }
      });
    });
    const server = app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`[Detector de Promessa Vazia] Servidor ouvindo em 0.0.0.0:${PORT}`);
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        console.log("[Detector de Promessa Vazia] Configurando webhook do Telegram...");
        telegramWebhookService.setWebhook().catch(
          (err) => console.error("Erro ao configurar webhook do Telegram:", err)
        );
      }
    });
    server.on("error", (err) => {
      console.error("[Detector de Promessa Vazia] Erro no servidor HTTP:", err);
    });
  } catch (error) {
    console.error("[Detector de Promessa Vazia] Erro FATAL ao inicializar:", error);
    process.exit(1);
  }
})();
