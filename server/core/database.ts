import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logError } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/detector.db');
const DATABASE_URL = process.env.DATABASE_URL;

let sqliteDb: sqlite3.Database | null = null;
let pgPool: pg.Pool | null = null;
const isPostgres = !!DATABASE_URL;

export async function initializeDatabase(): Promise<void> {
  if (isPostgres) {
    logInfo('[Database] Usando PostgreSQL (Supabase)');
    pgPool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      const client = await pgPool.connect();
      logInfo('[Database] Conectado ao PostgreSQL com sucesso');
      client.release();
    } catch (err) {
      logError('[Database] Erro ao conectar ao PostgreSQL', err as Error);
      throw err;
    }
  } else {
    logInfo('[Database] Usando SQLite local');
    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(DB_PATH, (err: any) => {
        if (err) {
          logError('[Database] Erro ao conectar ao SQLite', err);
          reject(err);
        } else {
          logInfo('[Database] Conectado ao SQLite em: ' + DB_PATH);
          createTables().then(resolve).catch(reject);
        }
      });
    });
  }
}

async function createTables(): Promise<void> {
  if (isPostgres) return;

  if (!sqliteDb) throw new Error('Database not initialized');

  return new Promise((resolve, reject) => {
    sqliteDb!.serialize(() => {
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, name VARCHAR(255), role TEXT DEFAULT 'user', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME, is_active BOOLEAN DEFAULT 1)`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token VARCHAR(500) NOT NULL, expires_at DATETIME NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS analyses (id TEXT PRIMARY KEY, user_id TEXT, text TEXT NOT NULL, author TEXT, category TEXT, extracted_promises TEXT, probability_score REAL, methodology_notes TEXT, data_sources TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS promises (id TEXT PRIMARY KEY, analysis_id TEXT NOT NULL, promise_text TEXT NOT NULL, category TEXT, confidence_score REAL, extracted_entities TEXT, FOREIGN KEY(analysis_id) REFERENCES analyses(id))`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, user_id TEXT, action VARCHAR(255) NOT NULL, resource_type VARCHAR(100), resource_id TEXT, ip_address VARCHAR(45), user_agent TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data_processing BOOLEAN DEFAULT 0, privacy_policy BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id))`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS public_data_cache (id TEXT PRIMARY KEY, data_type TEXT NOT NULL, data_source TEXT NOT NULL, data_content TEXT NOT NULL, last_updated DATETIME DEFAULT CURRENT_TIMESTAMP, expiry_date DATETIME)`);
      sqliteDb!.run(`CREATE TABLE IF NOT EXISTS analysis_history (id TEXT PRIMARY KEY, analysis_id TEXT NOT NULL, action TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(analysis_id) REFERENCES analyses(id))`, (err: any) => {
        if (err) logError('[Database] Erro ao criar tabelas', err);
        else {
          logInfo('[Database] Tabelas SQLite verificadas/criadas');
          resolve();
        }
      });
    });
  });
}

export function runQuery(sql: string, params: any[] = []): Promise<any> {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${counter++}`);
    }
    return pgPool!.query(pgSql, params).then(res => ({
      id: res.rows[0]?.id,
      changes: res.rowCount
    }));
  }

  if (!sqliteDb) throw new Error('Database not initialized');
  return new Promise((resolve, reject) => {
    sqliteDb!.run(sql, params, function(this: any, err: any) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${counter++}`);
    }
    return pgPool!.query(pgSql, params).then(res => res.rows[0]);
  }

  if (!sqliteDb) throw new Error('Database not initialized');
  return new Promise((resolve, reject) => {
    sqliteDb!.get(sql, params, (err: any, row: any) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  if (isPostgres) {
    let pgSql = sql;
    let counter = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${counter++}`);
    }
    return pgPool!.query(pgSql, params).then(res => res.rows);
  }

  if (!sqliteDb) throw new Error('Database not initialized');
  return new Promise((resolve, reject) => {
    sqliteDb!.all(sql, params, (err: any, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// ===== Funções de Usuário =====
export async function getUserById(userId: string) {
  return getQuery('SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?', [userId]);
}

export async function getUserByEmail(email: string) {
  return getQuery('SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ?', [email]);
}

export async function createUser(id: string, email: string, passwordHash: string, name: string) {
  await runQuery('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)', [id, email, passwordHash, name, 'user']);
  return getUserById(id);
}

export async function updateLastLogin(userId: string) {
  await runQuery('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
}

// ===== Funções de Auditoria =====
export async function createAuditLog(id: string, userId: string | null, action: string, resourceType: string | null, resourceId: string | null, ipAddress: string | null, userAgent: string | null) {
  await runQuery('INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, action, resourceType, resourceId, ipAddress, userAgent]);
}

// ===== Funções de Refresh Token =====
export async function createRefreshToken(id: string, userId: string, token: string, expiresAt: string) {
  await runQuery('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)', [id, userId, token, expiresAt]);
}

export async function getRefreshToken(token: string) {
  return getQuery('SELECT id, user_id, token, expires_at FROM refresh_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP', [token]);
}

export async function deleteRefreshToken(token: string) {
  await runQuery('DELETE FROM refresh_tokens WHERE token = ?', [token]);
}

// ===== Funções de Consentimento LGPD =====
export async function createConsent(id: string, userId: string, dataProcessing: boolean, privacyPolicy: boolean) {
  await runQuery('INSERT INTO consents (id, user_id, data_processing, privacy_policy) VALUES (?, ?, ?, ?)', [id, userId, dataProcessing ? 1 : 0, privacyPolicy ? 1 : 0]);
}

export async function getConsent(userId: string) {
  return getQuery('SELECT id, user_id, data_processing, privacy_policy, created_at FROM consents WHERE user_id = ?', [userId]);
}
