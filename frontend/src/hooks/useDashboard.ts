import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ConsolidationSummary {
  period: { month: number; year: number };
  status: string;
  closedAt: string | null;
  income: { planned: number; realized: number; pending: number };
  expense: { planned: number; realized: number; pending: number };
  balance: { planned: number; realized: number };
  byCategory: Array<{
    category: { id: string; name: string; type: string };
    planned: number;
    realized: number;
    items: BudgetItem[];
  }>;
  byMember: Array<{
    member: { id: string; name: string };
    planned: number;
    realized: number;
    items: BudgetItem[];
  }>;
  items: {
    pending: BudgetItem[];
    paid: BudgetItem[];
    cancelled: BudgetItem[];
  };
}

interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  type: string;
  installmentNumber?: number;
  totalInstallments?: number;
  ruleId?: string;
  member: { id: string; name: string };
  category: { id: string; name: string; type: string };
  transaction?: { id: string; amount: number; date: string; note?: string };
}

interface DailyFlow {
  day: number;
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface BestDate {
  date: string;
  day: number;
  month: number;
  year: number;
  cumulativeBalance: number;
  dailyIncome: number;
  dailyExpense: number;
  rank: 'ÓTIMO' | 'BOM' | 'OK' | 'RUIM';
  committedItems: Array<{
    description: string;
    amount: number;
    type: string;
    status: string;
    memberName: string;
  }>;
}

interface MonthlyConsolidation {
  id: string;
  month: number;
  year: number;
  status: string;
  closedAt: string | null;
}

export function useDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [consolidation, setConsolidation] = useState<MonthlyConsolidation | null>(null);
  const [summary, setSummary] = useState<ConsolidationSummary | null>(null);
  const [dailyFlow, setDailyFlow] = useState<DailyFlow[] | null>(null);
  const [bestDates, setBestDates] = useState<BestDate[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setMonth = (month: number) => {
    setSelectedMonth(month);
  };

  const setYear = (year: number) => {
    setSelectedYear(year);
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const consolidationRes = await api.get(`/consolidations?month=${selectedMonth}&year=${selectedYear}`);
        if (consolidationRes) {
          setConsolidation(consolidationRes as MonthlyConsolidation);
          const consolidation = consolidationRes as MonthlyConsolidation;
          const [summaryRes, dailyFlowRes, bestDatesRes] = await Promise.all([
            api.get(`/consolidations/${consolidation.id}/summary`),
            api.get(`/consolidations/${consolidation.id}/daily-flow`),
            api.get(`/consolidations/best-dates?months=2&month=${selectedMonth}&year=${selectedYear}`),
          ]);
          setSummary(summaryRes as ConsolidationSummary);
          setDailyFlow(dailyFlowRes as DailyFlow[]);
          setBestDates(bestDatesRes as BestDate[]);
        } else {
          setConsolidation(null);
          setSummary(null);
          setDailyFlow(null);
          setBestDates(null);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
        setConsolidation(null);
        setSummary(null);
        setDailyFlow(null);
        setBestDates(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  return {
    selectedMonth,
    selectedYear,
    setMonth,
    setYear,
    consolidation,
    summary,
    dailyFlow,
    bestDates,
    isLoading,
    error,
  };
}