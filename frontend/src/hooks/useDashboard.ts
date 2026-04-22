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
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Find consolidation for the selected month/year
        const consolidationData = await api.get<Consolidation>(`/consolidations?month=${selectedMonth}&year=${selectedYear}`);

        setConsolidation(consolidationData);

        if (consolidationData) {
          // Fetch summary and daily flow in parallel
          const [summaryData, dailyFlowData] = await Promise.all([
            api.get<Summary>(`/consolidations/${consolidationData.id}/summary`),
            api.get<DailyFlowData>(`/consolidations/${consolidationData.id}/daily-flow`),
          ]);

          setSummary(summaryData);
          setDailyFlow(dailyFlowData);
        } else {
          setSummary(null);
          setDailyFlow(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setConsolidation(null);
        setSummary(null);
        setDailyFlow(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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