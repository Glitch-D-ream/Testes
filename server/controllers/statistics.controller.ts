import { Request, Response } from 'express';
import { allQuery, getQuery } from '../core/database.js';
import { logError } from '../core/logger.js';

export class StatisticsController {
  async getGlobalStats(req: Request, res: Response) {
    try {
      // Total de análises
      const totalAnalysesResult = await getQuery('SELECT COUNT(*) as count FROM analyses');
      const totalAnalyses = totalAnalysesResult?.count || 0;

      // Total de promessas
      const totalPromisesResult = await getQuery('SELECT COUNT(*) as count FROM promises');
      const totalPromises = totalPromisesResult?.count || 0;

      // Viabilidade média
      const avgViabilityResult = await getQuery(
        'SELECT AVG(probability_score) as avg FROM analyses'
      );
      const averageViability = avgViabilityResult?.avg || 0;

      // Distribuição por categoria
      const categoriesResult = await allQuery(
        'SELECT category, COUNT(*) as count FROM promises GROUP BY category'
      );

      const categoriesDistribution: Record<string, number> = {};
      categoriesResult.forEach((row: any) => {
        categoriesDistribution[row.category || 'Geral'] = row.count;
      });

      // Viabilidade por categoria
      const viabilityResult = await allQuery(
        `SELECT p.category, AVG(a.probability_score) as avg_viability
         FROM promises p
         JOIN analyses a ON p.analysis_id = a.id
         GROUP BY p.category`
      );

      const viabilityByCategory: Record<string, number> = {};
      viabilityResult.forEach((row: any) => {
        viabilityByCategory[row.category || 'Geral'] = row.avg_viability || 0;
      });

      // Tendências (últimos 30 dias)
      const trendsResult = await allQuery(
        `SELECT 
           DATE(created_at) as date,
           AVG(probability_score) as viability,
           COUNT(*) as count
         FROM analyses
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      );

      const trends = trendsResult.map((row: any) => ({
        date: row.date,
        viability: (row.viability || 0) * 100,
        count: row.count,
      }));

      res.json({
        totalAnalyses,
        totalPromises,
        averageViability,
        categoriesDistribution,
        viabilityByCategory,
        trends,
      });
    } catch (error) {
      logError('Erro ao buscar estatísticas globais', error as Error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

export const statisticsController = new StatisticsController();
