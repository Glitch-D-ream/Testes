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
   * Orquestração da Tríade de Agentes para Análise Automática
   */
  async autoAnalyzePolitician(politicianName: string, userId: string | null = null) {
    logInfo(`[Orchestrator] Iniciando Tríade de Agentes para: ${politicianName}`);
    
    // 1. Scout: Busca dados brutos
    const rawSources = await scoutAgent.search(politicianName);
    if (rawSources.length === 0) {
      throw new Error(`O Agente Buscador não encontrou fontes para ${politicianName}`);
    }

    // 2. Filter: Limpa e valida relevância
    const filteredSources = await filterAgent.filter(rawSources);
    if (filteredSources.length === 0) {
      throw new Error(`O Agente Coletor filtrou todas as fontes como irrelevantes para ${politicianName}`);
    }

    // 3. Brain: Analisa profundamente e gera o dossiê
    return await brainAgent.analyze(politicianName, filteredSources, userId);
  }
}

export const searchService = new SearchService();
