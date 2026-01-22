import { useState, useCallback } from 'react';

interface AnalysisData {
  id: string;
  author: string;
  category: string;
  probability_score: number;
  promises: Array<{
    promise_text: string;
    category: string;
    confidence_score: number;
  }>;
}

interface ComparisonResult {
  politician1: {
    name: string;
    totalAnalyses: number;
    averageViability: number;
    promisesByCategory: Record<string, number>;
    viabilityByCategory: Record<string, number>;
  };
  politician2: {
    name: string;
    totalAnalyses: number;
    averageViability: number;
    promisesByCategory: Record<string, number>;
    viabilityByCategory: Record<string, number>;
  };
}

export function useComparisonData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ComparisonResult | null>(null);

  const fetchComparison = useCallback(
    async (author1: string, author2: string) => {
      setLoading(true);
      setError(null);

      try {
        // Buscar análises para ambos os autores
        const [res1, res2] = await Promise.all([
          fetch(`/api/analyze?author=${encodeURIComponent(author1)}`),
          fetch(`/api/analyze?author=${encodeURIComponent(author2)}`),
        ]);

        if (!res1.ok || !res2.ok) {
          throw new Error('Erro ao buscar dados de comparação');
        }

        const analyses1: AnalysisData[] = (await res1.json()).analyses;
        const analyses2: AnalysisData[] = (await res2.json()).analyses;

        const processAnalyses = (analyses: AnalysisData[]) => {
          const promisesByCategory: Record<string, number> = {};
          const viabilityByCategory: Record<string, number> = {};
          let totalViability = 0;

          analyses.forEach((analysis) => {
            const category = analysis.category || 'Geral';
            promisesByCategory[category] = (promisesByCategory[category] || 0) + 1;
            viabilityByCategory[category] =
              (viabilityByCategory[category] || 0) + (analysis.probability_score || 0);
            totalViability += analysis.probability_score || 0;
          });

          // Calcular médias
          Object.keys(viabilityByCategory).forEach((cat) => {
            viabilityByCategory[cat] = (viabilityByCategory[cat] / promisesByCategory[cat]) * 100;
          });

          return {
            totalAnalyses: analyses.length,
            averageViability: (totalViability / analyses.length) * 100,
            promisesByCategory,
            viabilityByCategory,
          };
        };

        const comparison: ComparisonResult = {
          politician1: {
            name: author1,
            ...processAnalyses(analyses1),
          },
          politician2: {
            name: author2,
            ...processAnalyses(analyses2),
          },
        };

        setData(comparison);
        return comparison;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    data,
    fetchComparison,
  };
}
