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

    // 3. Execução Assíncrona (Não bloqueia o retorno da API)
    // Usamos setImmediate para liberar a thread do Express
    setImmediate(async () => {
      try {
        logInfo(`[Orchestrator] [Job:${analysisId}] [DEBUG] Iniciando Tríade para: ${politicianName}`);
        
        // A GRANDE SIMPLIFICAÇÃO: Desativando Scout e Filter de notícias
        logInfo(`[Orchestrator] [Job:${analysisId}] [DEBUG] Modo Simplificado: Ignorando notícias, focando em dados oficiais.`);
        
        // Brain (O Brain agora será refatorado para lidar com a ausência de notícias)
        logInfo(`[Orchestrator] [Job:${analysisId}] [DEBUG] Chamando Brain para análise de dados oficiais...`);
        await brainAgent.analyze(politicianName, [], userId, analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] [DEBUG] Brain concluído. Atualizando status final...`);
        await supabase.from('analyses').update({ status: 'completed' }).eq('id', analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] Concluído com sucesso.`);
      } catch (error: any) {
        const errorMessage = error.message || 'Erro desconhecido durante a auditoria técnica';
        logError(`[Orchestrator] [Job:${analysisId}] Falha Crítica: ${errorMessage}`);
        
        // Tentar salvar o erro detalhado para que o usuário veja no site
        try {
          await supabase.from('analyses').update({
            status: 'failed',
            error_message: `Erro no Seth VII: ${errorMessage}. Por favor, tente novamente em instantes.`,
            text: `A auditoria falhou: ${errorMessage}`
          }).eq('id', analysisId);
        } catch (dbErr) {
          logError(`[Orchestrator] Erro ao reportar falha no banco: ${dbErr}`);
        }
      }
    });

    return { id: analysisId, status: 'processing' };
  }
}

export const searchService = new SearchService();
