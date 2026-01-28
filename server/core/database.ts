import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/schema.ts';
import { logInfo, logError } from './logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  logError('[Database] FATAL: SUPABASE_DB_URL não configurado. O servidor não pode iniciar.');
  throw new Error('FATAL: SUPABASE_DB_URL is not configured.');
}

// Configuração do cliente Postgres.js
const queryClient = postgres(SUPABASE_DB_URL, {
  ssl: 'require',
  max: 1, // Ideal para ambientes serverless
  idle_timeout: 20, // Segundos
  connect_timeout: 10, // Segundos
});

// Instância do Drizzle ORM
export const db = drizzle(queryClient, { schema });

logInfo('[Database] Drizzle ORM inicializado com sucesso.');

// Funções legadas agora lançam erro
export async function runQuery(): Promise<never> {
  logError("DEPRECATED: A função runQuery foi chamada, mas está obsoleta. Use o Drizzle ORM.");
  throw new Error("DEPRECATED: runQuery is obsolete. Use Drizzle ORM directly.");
}

export async function getQuery(): Promise<never> {
  logError("DEPRECATED: A função getQuery foi chamada, mas está obsoleta. Use o Drizzle ORM.");
  throw new Error("DEPRECATED: getQuery is obsolete. Use Drizzle ORM directly.");
}

export async function allQuery(): Promise<never> {
  logError("DEPRECATED: A função allQuery foi chamada, mas está obsoleta. Use o Drizzle ORM.");
  throw new Error("DEPRECATED: allQuery is obsolete. Use Drizzle ORM directly.");
}

// Re-exportar o cliente Supabase para compatibilidade com código legado
import { supabase } from './supabase.ts';
export { supabase };

/**
 * Retorna o cliente Supabase.
 * @deprecated Use o Drizzle ORM (db) para novas queries.
 */
export function getSupabase() {
  return supabase;
}

/**
 * Inicializa o banco de dados.
 * @deprecated O banco é inicializado automaticamente na importação.
 */
export async function initializeDatabase(): Promise<void> {
  logInfo('[Database] initializeDatabase chamado (noop - banco já inicializado).');
}
