import { useState, useCallback } from 'react';

export interface AuditReport {
  promise: string;
  category: string;
  viabilityScore: number;
  budgetContext: {
    totalBudget: number;
    executedBudget: number;
    executionRate: number;
  };
  politicalConsistency: {
    votedAgainstTheme: boolean;
    relevantVotes: any[];
  };
  verdict: 'REALISTA' | 'DUVIDOSA' | 'VAZIA';
  explanation: string;
}

export function useAudit() {
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async (politicianId: string, promise: string, category: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          politicianId,
          promise,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao executar auditoria');
      }

      const data: AuditReport = await response.json();
      setAudits(prev => [...prev, data]);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    audits,
    isLoading,
    error,
    runAudit,
  };
}
