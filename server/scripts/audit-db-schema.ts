
import { getSupabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';

async function auditSchema() {
  const supabase = getSupabase();
  logInfo('[Audit] Iniciando auditoria de schema da tabela "analyses"...');

  try {
    // Tentar buscar uma linha para ver as colunas retornadas
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .limit(1);

    if (error) {
      logError('[Audit] Erro ao acessar tabela "analyses"', error);
      
      // Se a tabela não existir, vamos tentar listar todas as tabelas
      const { data: tables, error: tableError } = await supabase
        .rpc('get_tables'); // Nota: rpc pode não existir, mas tentamos
      
      if (tableError) {
        logError('[Audit] Erro ao listar tabelas', tableError);
      } else {
        logInfo(`[Audit] Tabelas encontradas: ${JSON.stringify(tables)}`);
      }
      return;
    }

    if (data && data.length >= 0) {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      logInfo(`[Audit] Colunas detectadas na tabela "analyses": ${columns.join(', ')}`);
      
      const missing = ['politician_name', 'office', 'party', 'state'].filter(c => !columns.includes(c));
      if (missing.length > 0) {
        logInfo(`[Audit] Colunas FALTANTES: ${missing.join(', ')}`);
      } else {
        logInfo('[Audit] Todas as colunas recomendadas estão presentes.');
      }
    }
  } catch (err) {
    logError('[Audit] Erro inesperado na auditoria', err as Error);
  }
}

auditSchema();
