import { Request, Response } from 'express';
import { getSupabase } from '../core/database.js';
import { logError, logInfo } from '../core/logger.js';
import { searchService } from '../services/search.service.js';

export class SearchController {
  async searchPoliticians(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const query = q?.toString() || '';
      const supabase = getSupabase();

      // Buscar análises que mencionam o político ou o termo
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('author, probability_score, id, status')
        .or(`author.ilike.%${query}%,text.ilike.%${query}%`)
        .eq('status', 'completed'); // Apenas as concluídas na busca global

      if (error) throw error;

      // Agrupar por autor para simular uma busca de políticos
      const politicianMap = new Map();
      
      analyses?.forEach(a => {
        if (!a.author) return;
        if (!politicianMap.has(a.author)) {
          politicianMap.set(a.author, {
            name: a.author,
            analysesCount: 0,
            totalScore: 0,
            party: 'N/A', 
            state: 'N/A',
            id: a.author.toLowerCase().replace(/\s+/g, '-')
          });
        }
        const p = politicianMap.get(a.author);
        p.analysesCount++;
        p.totalScore += a.probability_score || 0;
      });

      const results = Array.from(politicianMap.values()).map(p => ({
        ...p,
        averageScore: Math.round(p.totalScore / p.analysesCount)
      }));

      return res.json({ results });
    } catch (error) {
      logError('Erro na busca de políticos', error as Error);
      return res.status(500).json({ error: 'Erro ao realizar busca' });
    }
  }

  /**
   * Realiza busca na web e análise automática (Job Based)
   */
  async autoAnalyze(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Nome do político é obrigatório' });
      }

      logInfo(`[Controller] Iniciando análise automática para: ${name}`);
      const userId = (req as any).userId || null;
      
      const result = await searchService.autoAnalyzePolitician(name, userId);
      
      return res.status(202).json(result); // 202 Accepted
    } catch (error) {
      logError('Erro na análise automática', error as Error);
      return res.status(500).json({ 
        error: 'Erro ao realizar análise automática',
        message: (error as Error).message 
      });
    }
  }

  /**
   * Verifica o status de uma análise em andamento
   */
  async checkStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('analyses')
        .select('id, status, error_message, probability_score')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Análise não encontrada' });

      return res.json(data);
    } catch (error) {
      logError('Erro ao verificar status da análise', error as Error);
      return res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }
}

export const searchController = new SearchController();
