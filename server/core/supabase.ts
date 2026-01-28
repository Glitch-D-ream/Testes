
import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from './logger.ts';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ceexfkjldhsbpugxvuyn.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  logError('⚠️ Variáveis de ambiente Supabase não configuradas. Algumas funcionalidades podem não funcionar.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

logInfo(`✅ Cliente Supabase inicializado: ${supabaseUrl}`);
