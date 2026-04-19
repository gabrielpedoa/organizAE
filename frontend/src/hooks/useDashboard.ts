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

interface CalendarDay {
  day: number;
  date: string;
  dailyIncome: number;
  dailyExpense: number;
  cumulativeBalance: number;
  pressure: 'LOW' | 'MEDIUM' | 'HIGH' | 'POSITIVE';
  items: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    status: string;
    memberName: string;
    categoryName: string;
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
  const [calendarPressure, setCalendarPressure] = useState<CalendarDay[] | null>(null);
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
          const [summaryRes, dailyFlowRes, calendarPressureRes] = await Promise.all([
            api.get(`/consolidations/${(consolidationRes as MonthlyConsolidation).id}/summary`),
            api.get(`/consolidations/${(consolidationRes as MonthlyConsolidation).id}/daily-flow`),
            api.get(`/consolidations/${(consolidationRes as MonthlyConsolidation).id}/calendar-pressure`),
          ]);
          setSummary(summaryRes as ConsolidationSummary);
          setDailyFlow(dailyFlowRes as DailyFlow[]);
          setCalendarPressure(calendarPressureRes as CalendarDay[]);
        } else {
          setConsolidation(null);
          setSummary(null);
          setDailyFlow(null);
          setCalendarPressure(null);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
        setConsolidation(null);
        setSummary(null);
        setDailyFlow(null);
        setCalendarPressure(null);
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
    calendarPressure,
    isLoading,
    error,
  };
}