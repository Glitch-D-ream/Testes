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
    setImmediate(async () => {
      try {
        logInfo(`[Orchestrator] [Job:${analysisId}] Iniciando Tríade Completa para: ${politicianName}`);
        
        // FASE 1: Scout - Busca de notícias e dados (Deep Search habilitado para máxima qualidade)
        const rawSources = await scoutAgent.search(politicianName, true);
        logInfo(`[Orchestrator] [Job:${analysisId}] Scout encontrou ${rawSources.length} fontes.`);
        
        // FASE 2: Filter - Filtragem de promessas e compromissos
        // Se houver poucas fontes, usamos o modo flexível
        const useFlexibleMode = rawSources.length < 5;
        const filteredSources = await filterAgent.filter(rawSources, useFlexibleMode);
        logInfo(`[Orchestrator] [Job:${analysisId}] Filter selecionou ${filteredSources.length} fontes relevantes.`);
        
        // FASE 3: Brain - Consolidação com Dados Oficiais (Câmara, Senado, SICONFI)
        logInfo(`[Orchestrator] [Job:${analysisId}] Chamando Brain para análise consolidada...`);
        // CORREÇÃO: A assinatura do BrainAgent.analyze é (politicianName, userId, existingId)
        // O parâmetro filteredSources não deve ser passado aqui, pois o BrainAgent já faz sua própria busca/filtro internamente.
        await brainAgent.analyze(politicianName, userId, analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] Análise concluída com sucesso.`);
      } catch (error: any) {
        const errorMessage = error.message || 'Erro técnico durante a auditoria';
        logError(`[Orchestrator] [Job:${analysisId}] Falha na Auditoria Real: ${errorMessage}`);
        
        try {
          await supabase.from('analyses').update({
            status: 'failed',
            error_message: `Auditoria Interrompida: ${errorMessage}. O Seth VII não utiliza dados estimados; por favor, tente novamente quando os serviços oficiais estiverem estáveis.`,
            text: `Falha na integridade dos dados: ${errorMessage}`,
            updated_at: new Date().toISOString()
          }).eq('id', analysisId);
          logInfo(`[Orchestrator] [Job:${analysisId}] Falha de integridade registrada.`);
        } catch (dbErr: any) {
          logError(`[Orchestrator] Erro ao registrar falha: ${dbErr.message}`);
        }
      }
    });

    return { id: analysisId, status: 'processing' };
  }
}

export const searchService = new SearchService();
