import { Router, Request, Response } from 'express';
import logger from '../core/logger';

export const statisticsRouter = Router();

/**
 * GET /api/statistics
 * Retorna estatísticas agregadas de análises
 */
statisticsRouter.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching statistics');

    // Dados simulados - substituir por queries reais do banco
    const statistics = {
      totalAnalyses: 1247,
      totalPromises: 5843,
      averageConfidence: 72.5,
      complianceRate: 68.3,
      byCategory: [
        { category: 'Educação', count: 1200, fulfilled: 840, pending: 240, failed: 120 },
        { category: 'Saúde', count: 980, fulfilled: 686, pending: 196, failed: 98 },
        { category: 'Infraestrutura', count: 1100, fulfilled: 770, pending: 220, failed: 110 },
        { category: 'Economia', count: 850, fulfilled: 595, pending: 170, failed: 85 },
        { category: 'Segurança', count: 713, fulfilled: 499, pending: 143, failed: 71 },
      ],
      trends: [
        { date: 'Jan', fulfilled: 65, pending: 20, failed: 15, complianceRate: 65 },
        { date: 'Fev', fulfilled: 68, pending: 18, failed: 14, complianceRate: 68 },
        { date: 'Mar', fulfilled: 70, pending: 16, failed: 14, complianceRate: 70 },
        { date: 'Abr', fulfilled: 72, pending: 15, failed: 13, complianceRate: 72 },
        { date: 'Mai', fulfilled: 71, pending: 17, failed: 12, complianceRate: 71 },
        { date: 'Jun', fulfilled: 69, pending: 19, failed: 12, complianceRate: 69 },
      ],
      lastUpdated: new Date().toISOString(),
    };

    res.json(statistics);
  } catch (error) {
    logger.error('Error fetching statistics', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/statistics/category/:category
 * Retorna estatísticas detalhadas de uma categoria específica
 */
statisticsRouter.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    logger.info(`Fetching statistics for category: ${category}`);

    // Dados simulados - substituir por query real do banco
    const categoryStats = {
      category,
      total: 1200,
      fulfilled: 840,
      pending: 240,
      failed: 120,
      complianceRate: 70,
      topAuthors: [
        { name: 'Autor A', promises: 120, fulfilled: 84, rate: 70 },
        { name: 'Autor B', promises: 100, fulfilled: 75, rate: 75 },
        { name: 'Autor C', promises: 95, fulfilled: 66, rate: 69.5 },
      ],
      monthlyTrend: [
        { month: 'Jan', count: 100, fulfilled: 70 },
        { month: 'Fev', count: 110, fulfilled: 77 },
        { month: 'Mar', count: 120, fulfilled: 84 },
        { month: 'Abr', count: 125, fulfilled: 87 },
        { month: 'Mai', count: 130, fulfilled: 91 },
        { month: 'Jun', count: 135, fulfilled: 94 },
      ],
    };

    res.json(categoryStats);
  } catch (error) {
    logger.error('Error fetching category statistics', error);
    res.status(500).json({
      error: 'Failed to fetch category statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/statistics/author/:authorId
 * Retorna estatísticas de um autor específico
 */
statisticsRouter.get('/author/:authorId', async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    logger.info(`Fetching statistics for author: ${authorId}`);

    // Dados simulados - substituir por query real do banco
    const authorStats = {
      authorId,
      name: 'Autor Exemplo',
      totalPromises: 450,
      fulfilled: 315,
      pending: 90,
      failed: 45,
      complianceRate: 70,
      averageConfidence: 75.5,
      byCategory: [
        { category: 'Educação', count: 100, fulfilled: 70 },
        { category: 'Saúde', count: 80, fulfilled: 56 },
        { category: 'Infraestrutura', count: 120, fulfilled: 84 },
        { category: 'Economia', count: 100, fulfilled: 70 },
        { category: 'Segurança', count: 50, fulfilled: 35 },
      ],
      historicalTrend: [
        { year: 2020, promises: 100, fulfilled: 60, rate: 60 },
        { year: 2021, promises: 120, fulfilled: 84, rate: 70 },
        { year: 2022, promises: 130, fulfilled: 97, rate: 74.6 },
        { year: 2023, promises: 100, fulfilled: 74, rate: 74 },
      ],
    };

    res.json(authorStats);
  } catch (error) {
    logger.error('Error fetching author statistics', error);
    res.status(500).json({
      error: 'Failed to fetch author statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
