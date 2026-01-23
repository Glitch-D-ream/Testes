import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logInfo, logError } from './logger.js';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

export async function initializeDatabase(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logInfo('[Database] SUPABASE_URL ou SUPABASE_KEY não configurados. O sistema tentará inicializar, mas chamadas ao banco podem falhar.');
    return;
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    logInfo('[Database] Supabase SDK inicializado com sucesso');
  } catch (err) {
    logError('[Database] Erro ao inicializar Supabase SDK', err as Error);
  }
}

export function getSupabase() {
  if (!supabase) {
    // Inicialização tardia se as variáveis estiverem disponíveis agora
    if (SUPABASE_URL && SUPABASE_KEY) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    }
    throw new Error('Database not initialized and credentials missing');
  }
  return supabase;
}

// ===== Funções de Usuário =====
export async function getUserById(userId: string) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, name, role, created_at, last_login')
    .eq('id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') logError('[Database] Erro ao buscar usuário por ID', error as any);
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, password_hash, name, role, created_at')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') logError('[Database] Erro ao buscar usuário por email', error as any);
  return data;
}

export async function createUser(id: string, email: string, passwordHash: string, name: string) {
  const { data, error } = await getSupabase()
    .from('users')
    .insert([{ id, email, password_hash: passwordHash, name, role: 'user' }])
    .select()
    .single();
  
  if (error) {
    logError('[Database] Erro ao criar usuário', error as any);
    throw error;
  }
  return data;
}

export async function updateLastLogin(userId: string) {
  const { error } = await getSupabase()
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) logError('[Database] Erro ao atualizar último login', error as any);
}

// ===== Funções de Auditoria =====
export async function createAuditLog(id: string, userId: string | null, action: string, resourceType: string | null, resourceId: string | null, ipAddress: string | null, userAgent: string | null) {
  const { error } = await getSupabase()
    .from('audit_logs')
    .insert([{
      id,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: ipAddress,
      user_agent: userAgent
    }]);
  
  if (error) logError('[Database] Erro ao criar log de auditoria', error as any);
}

// ===== Funções de Refresh Token =====
export async function createRefreshToken(id: string, userId: string, token: string, expiresAt: string) {
  const { error } = await getSupabase()
    .from('refresh_tokens')
    .insert([{ id, user_id: userId, token, expires_at: expiresAt }]);
  
  if (error) logError('[Database] Erro ao criar refresh token', error as any);
}

export async function getRefreshToken(token: string) {
  const { data, error } = await getSupabase()
    .from('refresh_tokens')
    .select('id, user_id, token, expires_at')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error && error.code !== 'PGRST116') logError('[Database] Erro ao buscar refresh token', error as any);
  return data;
}

export async function deleteRefreshToken(token: string) {
  const { error } = await getSupabase()
    .from('refresh_tokens')
    .delete()
    .eq('token', token);
  
  if (error) logError('[Database] Erro ao deletar refresh token', error as any);
}

// ===== Funções de Consentimento LGPD =====
export async function createConsent(id: string, userId: string, dataProcessing: boolean, privacyPolicy: boolean) {
  const { error } = await getSupabase()
    .from('consents')
    .insert([{
      id,
      user_id: userId,
      data_processing: dataProcessing,
      privacy_policy: privacyPolicy
    }]);
  
  if (error) logError('[Database] Erro ao criar consentimento', error as any);
}

export async function getConsent(userId: string) {
  const { data, error } = await getSupabase()
    .from('consents')
    .select('id, user_id, data_processing, privacy_policy, created_at')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') logError('[Database] Erro ao buscar consentimento', error as any);
  return data;
}

// ===== Funções de Cache de Dados Públicos =====
export async function savePublicDataCache(dataType: string, dataSource: string, dataContent: any, expiryDays: number = 7) {
  const id = nanoid();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  const { data: existing } = await getSupabase()
    .from('public_data_cache')
    .select('id')
    .eq('data_type', dataType)
    .eq('data_source', dataSource)
    .single();
  
  if (existing) {
    const { error } = await getSupabase()
      .from('public_data_cache')
      .update({
        data_content: dataContent,
        last_updated: new Date().toISOString(),
        expiry_date: expiryDate.toISOString()
      })
      .eq('id', existing.id);
    if (error) logError('[Database] Erro ao atualizar cache', error as any);
  } else {
    const { error } = await getSupabase()
      .from('public_data_cache')
      .insert([{
        id,
        data_type: dataType,
        data_source: dataSource,
        data_content: dataContent,
        expiry_date: expiryDate.toISOString()
      }]);
    if (error) logError('[Database] Erro ao inserir cache', error as any);
  }
}

export async function getPublicDataCache(dataType: string, dataSource: string) {
  const { data, error } = await getSupabase()
    .from('public_data_cache')
    .select('data_content')
    .eq('data_type', dataType)
    .eq('data_source', dataSource)
    .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`)
    .single();
  
  if (error && error.code !== 'PGRST116') logError('[Database] Erro ao buscar cache', error as any);
  return data ? data.data_content : null;
}

// ===== Funções de Compatibilidade (Legado) =====
export async function runQuery(sql: string, params: any[] = []): Promise<any> {
  return { id: nanoid(), changes: 0 };
}

export async function getQuery(sql: string, params: any[] = []): Promise<any> {
  return null;
}

export async function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return [];
}
