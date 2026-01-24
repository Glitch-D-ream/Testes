import axios from 'axios';
import { allQuery } from '../core/database.js';
import { logInfo, logError } from '../core/logger.js';
import { aiService } from './ai.service.js';

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
   * NOVO: Busca notícias e falas recentes de um político na Web
   */
  async searchPoliticianPromisesWeb(politicianName: string): Promise<SearchResult[]> {
    logInfo(`[Search Web] Iniciando busca automatizada para: ${politicianName}`);
    
    try {
      const prompt = `Busque e liste as 5 promessas ou falas mais recentes e relevantes do político "${politicianName}" sobre planos para o futuro, obras ou mudanças sociais. 
      Retorne APENAS um array JSON com objetos contendo: title, link, snippet (a fala ou promessa em si) e source.`;

      const response = await axios.post('https://text.pollinations.ai/', {
        messages: [
          { role: 'system', content: 'Você é um buscador de notícias políticas que retorna apenas JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'openai',
        jsonMode: true
      }, { timeout: 30000 });

      let results = response.data;
      if (typeof results === 'string') {
        results = JSON.parse(results.replace(/```json\n?|\n?```/g, '').trim());
      }

      return results as SearchResult[];
    } catch (error) {
      logError(`[Search Web] Erro ao buscar dados para ${politicianName}`, error as Error);
      return [];
    }
  }

  /**
   * NOVO: Processa os resultados da busca web e gera uma análise automática
   */
  async autoAnalyzePolitician(politicianName: string, userId: string | null = null) {
    const searchResults = await this.searchPoliticianPromisesWeb(politicianName);
    
    if (searchResults.length === 0) {
      throw new Error(`Não foram encontradas falas recentes para ${politicianName}`);
    }

    const consolidatedText = searchResults.map(r => `Fonte: ${r.source}\nFala: ${r.snippet}`).join('\n\n');
    
    logInfo(`[Auto-Analysis] Analisando ${searchResults.length} fontes para ${politicianName}`);
    
    const { analysisService } = await import('./analysis.service.js');
    
    return await analysisService.createAnalysis(
      userId,
      consolidatedText,
      politicianName,
      'BUSCA_AUTOMATICA'
    );
  }
}

export const searchService = new SearchService();
