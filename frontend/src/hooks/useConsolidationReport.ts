import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConsolidationSummary } from '@/lib/types';

export function useConsolidationReport(consolidationId: string) {
  const [summary, setSummary] = useState<ConsolidationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!consolidationId) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    api.get<ConsolidationSummary>(`/consolidations/${consolidationId}/summary`)
      .then((data) => { if (!cancelled) { setSummary(data); } })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar relatório');
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [consolidationId]);

  return { summary, isLoading, error };
}
