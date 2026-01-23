import { nanoid } from 'nanoid';
import { logInfo, logError } from './logger.js';

// Mock de Banco de Dados para ambiente Serverless sem Supabase configurado
export async function initializeDatabase(): Promise<void> {
  logInfo('[Database] Usando Mock Database para ambiente Vercel');
}

export function getSupabase() {
  // Retorna um mock do cliente Supabase para evitar quebras
  return {
    from: (table: string) => ({
      select: (columns?: string, options?: any) => ({
        eq: (col: string, val: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (col: string, options: any) => ({
            range: (from: number, to: number) => Promise.resolve({ data: [], count: 0, error: null })
          }),
          gte: (col: string, val: any) => ({
            order: (col: string, options: any) => Promise.resolve({ data: [], error: null })
          })
        }),
        order: (col: string, options: any) => ({
          range: (from: number, to: number) => Promise.resolve({ data: [], count: 0, error: null })
        }),
        limit: (n: number) => Promise.resolve({ data: [], error: null }),
        gte: (col: string, val: any) => ({
          order: (col: string, options: any) => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        then: (cb: any) => Promise.resolve({ data: null, error: null }).then(cb)
      }),
      update: (data: any) => ({
        eq: (col: string, val: any) => Promise.resolve({ data: null, error: null })
      }),
      delete: () => ({
        eq: (col: string, val: any) => Promise.resolve({ data: null, error: null })
      }),
      or: (query: string) => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    })
  };
}

export async function getUserById(userId: string) { return null; }
export async function getUserByEmail(email: string) { return null; }
export async function createUser(id: string, email: string, passwordHash: string, name: string) { return { id, email, name }; }
export async function updateLastLogin(userId: string) {}
export async function createAuditLog(...args: any[]) {}
export async function createRefreshToken(...args: any[]) {}
export async function getRefreshToken(token: string) { return null; }
export async function deleteRefreshToken(token: string) {}
export async function createConsent(...args: any[]) {}
export async function getConsent(userId: string) { return null; }
export async function savePublicDataCache(...args: any[]) {}
export async function getPublicDataCache(dataType: string, dataSource: string) { return null; }

// Funções de Compatibilidade (Legado)
export async function runQuery(sql: string, params: any[] = []): Promise<any> {
  return { id: nanoid(), changes: 0 };
}
export async function getQuery(sql: string, params: any[] = []): Promise<any> {
  return null;
}
export async function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return [];
}
