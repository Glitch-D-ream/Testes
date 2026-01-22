
import { Request, Response } from 'express';
import { getSupabase } from '../core/database.js';
import { logError } from '../core/logger.js';

export class StatisticsController {
  async getGlobalStats(req: Request, res: Response) {
    try {
      const supabase = getSupabase();

      // 1. Total de análises
      const { count: totalAnalyses, error: err1 } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true });

      // 2. Total de promessas
      const { count: totalPromises, error: err2 } = await supabase
        .from('promises')
        .select('*', { count: 'exact', head: true });

      // 3. Viabilidade média
      const { data: viabilityData, error: err3 } = await supabase
        .from('analyses')
        .select('probability_score');
      
      const averageViability = viabilityData && viabilityData.length > 0
        ? viabilityData.reduce((acc: number, curr: any) => acc + (curr.probability_score || 0), 0) / viabilityData.length
        : 0;

      // 4. Distribuição por categoria
      const { data: categoriesData, error: err4 } = await supabase
        .from('promises')
        .select('category');

      const categoriesDistribution: Record<string, number> = {};
      categoriesData?.forEach((row: any) => {
        const cat = row.category || 'Geral';
        categoriesDistribution[cat] = (categoriesDistribution[cat] || 0) + 1;
      });

      // 5. Tendências (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: trendsData, error: err5 } = await supabase
        .from('analyses')
        .select('created_at, probability_score')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const trendsMap = new Map();
      trendsData?.forEach((item: any) => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!trendsMap.has(date)) {
          trendsMap.set(date, { date, viability: 0, count: 0, sum: 0 });
        }
        const entry = trendsMap.get(date);
        entry.count++;
        entry.sum += (item.probability_score || 0);
        entry.viability = (entry.sum / entry.count) * 100;
      });

      const trends = Array.from(trendsMap.values());

      if (err1 || err2 || err3 || err4 || err5) {
        logError('Erro em uma das queries de estatísticas', (err1 || err2 || err3 || err4 || err5) as any);
      }

      return (res as any).json({
        totalAnalyses: totalAnalyses || 0,
        totalPromises: totalPromises || 0,
        averageViability,
        categoriesDistribution,
        viabilityByCategory: {}, 
        trends,
      });
    } catch (error) {
      logError('Erro ao buscar estatísticas globais', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

export const statisticsController = new StatisticsController();
