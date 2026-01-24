import { useState, useCallback } from 'react';

export interface AnalysisResult {
  id: string;
  text: string;
  author: string;
  category: string;
  probabilityScore: number;
  promisesCount: number;
  promises: any[];
  createdAt?: string;
}

interface UseAnalysisOptions {
  onSuccess?: (data: AnalysisResult) => void;
  onError?: (error: Error) => void;
}

export function useAnalysis(options?: UseAnalysisOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<AnalysisResult | null>(null);

  const submit = useCallback(
    async (text: string, author: string, category: string) => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, author, category }),
        });

        if (!response.ok) {
          throw new Error('Erro ao submeter análise');
        }

        const result = await response.json();
        const normalized = {
          ...result,
          probabilityScore: result.probability_score || result.probabilityScore || 0,
          createdAt: result.created_at || result.createdAt
        };
        setData(normalized);
        options?.onSuccess?.(normalized);
        return normalized;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const getById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/analyze/${id}`);

        if (!response.ok) {
          throw new Error('Análise não encontrada');
        }

        const result = await response.json();
        const normalized = {
          ...result,
          probabilityScore: result.probability_score || result.probabilityScore || 0,
          createdAt: result.created_at || result.createdAt
        };
        setData(normalized);
        options?.onSuccess?.(normalized);
        return normalized;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    loading,
    error,
    data,
    submit,
    getById,
  };
}
