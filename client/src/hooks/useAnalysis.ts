import { useState, useCallback } from 'react';

interface AnalysisResult {
  id: string;
  probabilityScore: number;
  promisesCount: number;
  promises: any[];
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
        // Obter token CSRF
        const csrfRes = await fetch('/api/csrf-token');
        const { csrfToken } = await csrfRes.json();

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-xsrf-token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ text, author, category }),
        });

        if (!response.ok) {
          throw new Error('Erro ao submeter análise');
        }

        const result: AnalysisResult = await response.json();
        setData(result);
        options?.onSuccess?.(result);
        return result;
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
        const response = await fetch(`/api/analyze/${id}`);

        if (!response.ok) {
          throw new Error('Análise não encontrada');
        }

        const result: AnalysisResult = await response.json();
        setData(result);
        options?.onSuccess?.(result);
        return result;
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
