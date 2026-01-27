import { getSupabase } from '../core/database.ts';
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { nanoid } from 'nanoid';

export interface DataSnapshot {
  id: string;
  data_source: string;
  data_type: string;
  payload: any;
  created_at: string;
  version: number;
}

export class SnapshotService {
  /**
   * Cria um snapshot imutável de um dado governamental
   */
  async createSnapshot(source: string, type: string, payload: any): Promise<void> {
    try {
      const supabase = getSupabase();
      
      // 1. Buscar a última versão para este source
      const { data: lastVersion } = await supabase
        .from('data_snapshots')
        .select('version')
        .eq('data_source', source)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (lastVersion?.version || 0) + 1;

      // 2. Inserir novo snapshot imutável
      const { error } = await supabase
        .from('data_snapshots')
        .insert([{
          id: nanoid(),
          data_source: source,
          data_type: type,
          payload: payload,
          version: nextVersion,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      logInfo(`[Snapshot] Novo snapshot criado: ${source} (v${nextVersion})`);
    } catch (error) {
      logWarn(`[Snapshot] Falha ao criar snapshot para ${source}: ${error}`);
    }
  }

  /**
   * Recupera o snapshot mais recente para um dado governamental (Fallback)
   */
  async getLatestSnapshot<T>(source: string): Promise<T | null> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('data_snapshots')
        .select('payload, created_at, version')
        .eq('data_source', source)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      
      logWarn(`[Snapshot] Usando FALLBACK de snapshot para ${source} (v${data.version} de ${data.created_at})`);
      return data.payload as T;
    } catch (error) {
      logError(`[Snapshot] Erro ao recuperar snapshot para ${source}`, error as Error);
      return null;
    }
  }
}

export const snapshotService = new SnapshotService();
