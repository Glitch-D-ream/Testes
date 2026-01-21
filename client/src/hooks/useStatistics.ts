import { useState, useEffect, useCallback } from 'react';

export interface PromiseDistributionData {
  category: string;
  count: number;
  fulfilled: number;
  pending: number;
  failed: number;
}

export interface ComplianceTrendData {
  date: string;
  fulfilled: number;
  pending: number;
  failed: number;
  complianceRate: number;
}

export interface StatisticsData {
  totalAnalyses: number;
  totalPromises: number;
  averageConfidence: number;
  complianceRate: number;
  byCategory: PromiseDistributionData[];
  trends: ComplianceTrendData[];
  lastUpdated: string;
}

export interface UseStatisticsReturn {
  data: StatisticsData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook para consumir dados de estatísticas da API
 * Inclui cache e refetch manual
 */
export function useStatistics(): UseStatisticsReturn {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/statistics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      const statistics: StatisticsData = await response.json();
      setData(statistics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();

    // Refetch a cada 5 minutos
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStatistics]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

/**
 * Hook para consumir estatísticas de uma categoria específica
 */
export function useCategoryStatistics(category: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/statistics/category/${encodeURIComponent(category)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch category statistics: ${response.statusText}`);
        }

        const stats = await response.json();
        setData(stats);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Error fetching category statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryStats();
  }, [category]);

  return { data, loading, error };
}

/**
 * Hook para consumir estatísticas de um autor específico
 */
export function useAuthorStatistics(authorId: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAuthorStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/statistics/author/${encodeURIComponent(authorId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch author statistics: ${response.statusText}`);
        }

        const stats = await response.json();
        setData(stats);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Error fetching author statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorStats();
  }, [authorId]);

  return { data, loading, error };
}
