import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  BudgetItem,
  ConsolidationSummary,
  ExpenseType,
  MonthlyConsolidation,
  TransactionType,
} from '@/lib/types';

export interface ConfirmPaymentPayload {
  paidAt: string;
  amount: number;
  note?: string;
}

export interface ConfirmReceiptPayload {
  receivedAt: string;
  amount: number;
  note?: string;
}

export interface AddBudgetItemPayload {
  memberId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  dueDate: string;
  expenseType?: ExpenseType;
  note?: string;
}

export interface UpdateBudgetItemPayload {
  amount?: number;
  description?: string;
  dueDate?: string;
  note?: string;
}

export function useConsolidation() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [consolidation, setConsolidation] = useState<MonthlyConsolidation | null>(null);
  const [summary, setSummary] = useState<ConsolidationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (id: string) => {
    const data = await api.get<ConsolidationSummary>(`/consolidations/${id}/summary`);
    setSummary(data);
  }, []);

  // Auto-load: try GET first, fall back to POST generate if not found.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to find an existing consolidation for this period
        let data = await api.get<MonthlyConsolidation | null>(
          `/consolidations?month=${month}&year=${year}`,
        );

        // Generate (idempotent) for new or open consolidations — ensures rules added
        // after the initial generation still appear as BudgetItems.
        if (!data || data.status === 'OPEN') {
          data = await api.post<MonthlyConsolidation>('/consolidations/generate', { month, year });
        }

        if (!cancelled) {
          setConsolidation(data);
          if (data) {
            await fetchSummary(data.id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar consolidação';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmPayment = useCallback(
    async (item: BudgetItem, payload: ConfirmPaymentPayload) => {
      await api.post<BudgetItem>(`/consolidations/items/${item.id}/pay`, payload);
      toast.success('Pagamento confirmado');
      if (consolidation) await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const confirmReceipt = useCallback(
    async (item: BudgetItem, payload: ConfirmReceiptPayload) => {
      await api.post<BudgetItem>(`/consolidations/items/${item.id}/receive`, payload);
      toast.success('Recebimento confirmado');
      if (consolidation) await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const cancelItem = useCallback(
    async (item: BudgetItem, reason?: string) => {
      await api.post(`/consolidations/items/${item.id}/cancel`, { reason });
      toast.success('Item cancelado');
      if (consolidation) await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const updateItem = useCallback(
    async (item: BudgetItem, payload: UpdateBudgetItemPayload) => {
      await api.patch<BudgetItem>(`/consolidations/items/${item.id}`, payload);
      toast.success('Item atualizado');
      if (consolidation) await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const addItem = useCallback(
    async (payload: AddBudgetItemPayload) => {
      if (!consolidation) return;
      await api.post<BudgetItem>(`/consolidations/${consolidation.id}/items`, payload);
      toast.success('Item adicionado');
      await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const closeConsolidation = useCallback(
    async (force = false) => {
      if (!consolidation) return;
      await api.post(`/consolidations/${consolidation.id}/close`, { force });
      toast.success('Período fechado');
      setConsolidation((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      await fetchSummary(consolidation.id);
    },
    [consolidation, fetchSummary],
  );

  const resetConsolidation = useCallback(async () => {
    if (!consolidation) return;
    setIsResetting(true);
    try {
      await api.post(`/consolidations/${consolidation.id}/reset`, {});
      toast.success('Consolidação resetada com sucesso');
      await fetchSummary(consolidation.id);
      setConsolidation((prev) => (prev ? { ...prev, status: 'OPEN', closedAt: null } : null));
    } finally {
      setIsResetting(false);
    }
  }, [consolidation, fetchSummary]);

  /** Navigate to adjacent month, resetting consolidation state. */
  const navigateMonth = useCallback(
    (direction: -1 | 1) => {
      let m = month + direction;
      let y = year;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      setIsLoading(true);
      setConsolidation(null);
      setSummary(null);
      setError(null);
      setMonth(m);
      setYear(y);
    },
    [month, year],
  );

  return {
    month,
    year,
    consolidation,
    summary,
    isLoading,
    isResetting,
    error,
    confirmPayment,
    confirmReceipt,
    cancelItem,
    updateItem,
    addItem,
    closeConsolidation,
    resetConsolidation,
    navigateMonth,
  };
}
