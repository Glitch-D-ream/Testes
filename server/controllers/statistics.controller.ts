import { Request, Response } from 'express';
import { getSupabase } from '../core/database.ts';
import { logError } from '../core/logger.ts';

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

      // 3. Viabilidade média e autores
      const { data: analysisData, error: err3 } = await supabase
        .from('analyses')
        .select('probability_score, author');
      
      const averageConfidence = analysisData && analysisData.length > 0
        ? analysisData.reduce((acc: number, curr: any) => acc + (curr.probability_score || 0), 0) / analysisData.length
        : 0;

      const totalAuthors = new Set(analysisData?.map(a => a.author).filter(Boolean)).size;

      // 4. Distribuição por categoria
      const { data: categoriesData, error: err4 } = await supabase
        .from('promises')
        .select('category');

      const categoriesMap: Record<string, number> = {};
      categoriesData?.forEach((row: any) => {
        const cat = row.category || 'Geral';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      });

      const byCategory = Object.entries(categoriesMap).map(([category, count]) => ({
        category,
        count
      })).sort((a, b) => b.count - a.count);

      // 5. Alertas de Contradição Temporal (Novas Análises com penalidade alta)
      const { data: contradictionsData } = await supabase
        .from('analyses')
        .select('id, author, category, probability_score, data_sources, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const alerts = contradictionsData?.filter((a: any) => {
        const penalty = a.data_sources?.trajectoryAnalysis?.penalty || 0;
        return penalty > 0.15; // Alerta para penalidades significativas
      }).map((a: any) => ({
        id: a.id,
        author: a.author,
        category: a.category,
        severity: a.data_sources.trajectoryAnalysis.penalty > 0.3 ? 'high' : 'medium',
        message: `Contradição detectada: ${a.data_sources.trajectoryAnalysis.reason}`,
        date: a.created_at
      })) || [];

      if (err1 || err2 || err3 || err4) {
        logError('Erro em uma das queries de estatísticas', (err1 || err2 || err3 || err4) as any);
      }

      return res.json({
        totalAnalyses: totalAnalyses || 0,
        totalPromises: totalPromises || 0,
        averageConfidence,
        totalAuthors,
        byCategory,
        alerts
      });
    } catch (error) {
      logError('Erro ao buscar estatísticas globais', error as Error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
}

export const statisticsController = new StatisticsController();
