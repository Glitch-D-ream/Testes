import { allQuery } from '../core/database.js';
import { logInfo, logError } from '../core/logger.js';
import { scoutAgent } from '../agents/scout.js';
import { filterAgent } from '../agents/filter.js';
import { brainAgent } from '../agents/brain.js';

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
    const { getSupabase } = await import('../core/database.js');
    const supabase = getSupabase();
    const { nanoid } = await import('nanoid');
    
    // 1. Verificar Cache (L1) - Análise recente concluída nas últimas 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('analyses')
      .select('id, status, created_at')
      .ilike('author', `%${politicianName}%`)
      .eq('status', 'completed')
      .gt('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      logInfo(`[Orchestrator] Cache L1 encontrado para ${politicianName}. Retornando ID: ${existing.id}`);
      return { id: existing.id, status: 'completed', cached: true };
    }

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
        logInfo(`[Orchestrator] [Job:${analysisId}] Iniciando Tríade para: ${politicianName}`);
        
        // Scout
        const rawSources = await scoutAgent.search(politicianName);
        if (rawSources.length === 0) {
          throw new Error('O Agente Buscador não encontrou notícias ou fontes recentes para este político. Tente um nome mais conhecido.');
        }

        // Filter
        const filteredSources = await filterAgent.filter(rawSources);
        if (filteredSources.length === 0) {
          throw new Error('Nenhuma promessa ou compromisso político claro foi detectado nas notícias encontradas.');
        }

        // Brain (O Brain já salva os dados finais no banco)
        await brainAgent.analyze(politicianName, filteredSources, userId, analysisId);
        
        logInfo(`[Orchestrator] [Job:${analysisId}] Concluído com sucesso.`);
      } catch (error: any) {
        logError(`[Orchestrator] [Job:${analysisId}] Falha: ${error.message}`);
        // Atualizar o status para failed no banco para o polling do frontend parar
        await supabase.from('analyses').update({
          status: 'failed',
          error_message: error.message // Corrigido para error_message conforme o banco
        }).eq('id', analysisId);
      }
    });

    return { id: analysisId, status: 'processing' };
  }
}

export const searchService = new SearchService();
