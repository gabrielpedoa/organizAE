import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Consolidation, Summary, DailyFlowData } from '@/lib/types';

export function useDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [consolidation, setConsolidation] = useState<Consolidation>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyFlow, setDailyFlow] = useState<DailyFlowData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const consolidationData = await api.get<Consolidation>(
          `/consolidations?month=${selectedMonth}&year=${selectedYear}`
        );
        if (cancelled) return;
        setConsolidation(consolidationData);
        if (consolidationData) {
          const [summaryData, dailyFlowData] = await Promise.all([
            api.get<Summary>(`/consolidations/${consolidationData.id}/summary`),
            api.get<DailyFlowData>(`/consolidations/${consolidationData.id}/daily-flow`),
          ]);
          if (cancelled) return;
          setSummary(summaryData);
          setDailyFlow(dailyFlowData);
        } else {
          setSummary(null);
          setDailyFlow(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setConsolidation(null);
        setSummary(null);
        setDailyFlow(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear]);

  return {
    selectedMonth,
    selectedYear,
    setMonth: setSelectedMonth,
    setYear: setSelectedYear,
    consolidation,
    summary,
    dailyFlow,
    isLoading,
    error,
  };
}