import { useState, useCallback } from 'react';

export interface Politician {
  id: string;
  name: string;
  party: string;
  office: string;
  region: string;
  photoUrl?: string;
  bio?: string;
  credibilityScore: number;
}

export function usePoliticianSearch() {
  const [results, setResults] = useState<Politician[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search/politicians?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar políticos');
      }

      const data: Politician[] = await response.json();
      setResults(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setResults([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
  };
}
