
import { logInfo, logError } from '../core/logger.ts';
import { getSupabase } from '../core/database.ts';

export interface Connection {
  type: string;
  ids: string[];
  source: string;
  discovered_at: Date;
}

/**
 * RelationshipMiner
 * Extrai conexões entre entidades (CNPJ, Processos, Contratos) de textos políticos.
 */
export class RelationshipMiner {
  // Padrões brasileiros para IDs oficiais
  private static patterns = {
    PROCESSO: /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, // 0000000-00.0000.0.00.0000
    CNPJ: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
    CONTRATO: /Contrato Nº[\s:]*([A-Z0-9.\-\/]+)/gi,
    LICITACAO: /Licitação[\s:]*([0-9]+\/[0-9]+)/gi,
    VALOR: /R\$[\s]?(\d{1,3}(\.\d{3})*,\d{2})/g
  };

  /**
   * Extrai conexões de um texto e as salva no banco de dados
   */
  static async mineAndStore(text: string, sourceDocument: string, sourceEntityId: string) {
    try {
      const connections = this.extractConnections(text);
      
      if (connections.length === 0) return [];

      logInfo(`[RelationshipMiner] Extraídas ${connections.length} conexões do documento ${sourceDocument}`);

      const supabase = getSupabase();
      const records = [];

      for (const conn of connections) {
        for (const id of conn.ids) {
          records.push({
            source_id: sourceEntityId,
            target_id: id,
            relationship_type: conn.type,
            source_document: sourceDocument,
            confidence_score: 1.0,
            metadata: { original_text_snippet: text.substring(0, 200) }
          });
        }
      }

      if (records.length > 0) {
        const { error } = await supabase
          .from('entity_connections')
          .insert(records);

        if (error) throw error;
      }

      return records;
    } catch (error) {
      logError('[RelationshipMiner] Erro ao minerar e salvar conexões:', error as Error);
      return [];
    }
  }

  /**
   * Apenas extrai os padrões do texto
   */
  private static extractConnections(text: string): Connection[] {
    const connections: Connection[] = [];
    
    for (const [type, regex] of Object.entries(this.patterns)) {
      const matches = text.match(regex);
      if (matches) {
        // Limpeza básica para remover duplicatas no mesmo texto
        const uniqueMatches = Array.from(new Set(matches));
        connections.push({
          type,
          ids: uniqueMatches,
          source: 'document',
          discovered_at: new Date()
        });
      }
    }
    
    return connections;
  }
}
