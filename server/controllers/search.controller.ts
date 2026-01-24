import { Request, Response } from 'express';
import { getSupabase } from '../core/database.js';
import { logError } from '../core/logger.js';

export class SearchController {
  async searchPoliticians(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const query = q?.toString() || '';
      const supabase = getSupabase();

      // Buscar análises que mencionam o político ou o termo
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('author, probability_score')
        .or(`author.ilike.%${query}%,text.ilike.%${query}%`);

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
            party: 'N/A', // Em produção, cruzar com dados do TSE
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
}

export const searchController = new SearchController();
