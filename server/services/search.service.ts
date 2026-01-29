import { allQuery } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import { scoutAgent } from '../agents/scout.ts';
import { filterAgent } from '../agents/filter.ts';
import { brainAgent } from '../agents/brain.ts';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date?: string;
}

export class SearchService {
  /**
   * Busca políticos por nome, partido ou região no banco de dados local
   */
  async searchPoliticians(query: string) {
    logInfo(`[Search] Buscando políticos no banco: "${query}"`);
    
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
      logError('[Search] Erro ao buscar políticos:', error as Error);
      return [];
    }
  }

  /**
   * Busca promessas por texto ou categoria no banco de dados local
   */
  async searchPromises(query: string) {
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
      logError('[Search] Erro ao buscar promessas:', error as Error);
      return [];
    }
  }

  /**
   * Busca global (Políticos + Promessas)
   */
  async globalSearch(query: string) {
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
  async autoAnalyzePolitician(politicianName: string, userId: string | null = null) {
    const { getSupabase } = await import('../core/database.ts');
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    // Cache L1 desativado para garantir que a lógica mais recente seja aplicada
    logInfo(`[Orchestrator] Ignorando cache para garantir análise com lógica atualizada: ${politicianName}`);

    // 2. Criar Job de Análise (Pendente/Processando)
    const analysisId = nanoid();
    await supabase.from('analyses').insert([{
      id: analysisId,
      user_id: userId,
      author: politicianName,
      text: `Análise automática iniciada para ${politicianName}`,
      status: 'processing'
    }]);

    // 3. Despachar para a Fila (BullMQ)
    const { analysisQueue } = await import('../queues/index.ts');
    
    try {
      logInfo(`[Orchestrator] Despachando análise de ${politicianName} para a fila.`);
      await analysisQueue.add({
        politicianName,
        userId,
        analysisId,
        timestamp: new Date().toISOString()
      }, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        timeout: 600000 // 10 minutos de timeout para análises profundas
      });
    } catch (queueError) {
      logError(`[Orchestrator] Erro ao adicionar à fila, usando fallback setImmediate`, queueError as Error);
      // Fallback de segurança se o Redis estiver offline
      setImmediate(async () => {
        try {
          await brainAgent.analyze(politicianName, userId, analysisId);
        } catch (err) {
          logError(`[Orchestrator] Fallback falhou para ${politicianName}`, err as Error);
        }
      });
    }

    return { id: analysisId, status: 'processing' };
  }
}

export const searchService = new SearchService();
