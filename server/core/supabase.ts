import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from './logger.ts';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ceexfkjldhsbpugxvuyn.supabase.co';

// Aceita múltiplos nomes de variáveis para compatibilidade
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  '';

if (!supabaseUrl || !supabaseKey) {
  logError('[Supabase] FATAL: Variáveis de ambiente Supabase não configuradas (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias).');
  throw new Error('FATAL: Supabase credentials are not configured.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

logInfo(`[Supabase] Cliente inicializado com sucesso: ${supabaseUrl}`);
