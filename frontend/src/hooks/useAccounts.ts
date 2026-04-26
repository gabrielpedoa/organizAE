import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Account, AccountEntry, InvestmentPosition } from '@/lib/types';

export interface CreateAccountPayload {
  name: string;
  type: string;
  institution: string;
  initialBalance?: string;
  memberIds?: string[];
}

export interface UpdateAccountPayload {
  name?: string;
  type?: string;
  institution?: string;
}

export interface CreateInvestmentPayload {
  name: string;
  productType: string;
  amount: string;
  note?: string;
}

export interface UpdateInvestmentPayload {
  name?: string;
  productType?: string;
  amount?: string;
  note?: string;
}

export interface TransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  date: string;
  description?: string;
  note?: string;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Account[]>('/accounts');
      setAccounts(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar contas';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api.get<Account[]>('/accounts')
      .then((data) => { if (!cancelled) setAccounts(data); })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar contas';
          setError(msg);
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const createAccount = useCallback(async (payload: CreateAccountPayload) => {
    await api.post('/accounts', payload);
    toast.success('Conta criada com sucesso');
    await fetchAccounts();
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (id: string, payload: UpdateAccountPayload) => {
    await api.patch(`/accounts/${id}`, payload);
    toast.success('Conta atualizada');
    await fetchAccounts();
  }, [fetchAccounts]);

  const removeAccount = useCallback(async (id: string) => {
    await api.delete(`/accounts/${id}`);
    toast.success('Conta removida');
    await fetchAccounts();
  }, [fetchAccounts]);

  const createInvestment = useCallback(async (accountId: string, payload: CreateInvestmentPayload) => {
    await api.post(`/accounts/${accountId}/investments`, payload);
    toast.success('Investimento adicionado');
    await fetchAccounts();
  }, [fetchAccounts]);

  const updateInvestment = useCallback(async (investmentId: string, payload: UpdateInvestmentPayload) => {
    await api.patch(`/accounts/investments/${investmentId}`, payload);
    toast.success('Investimento atualizado');
    await fetchAccounts();
  }, [fetchAccounts]);

  const removeInvestment = useCallback(async (investmentId: string) => {
    await api.delete(`/accounts/investments/${investmentId}`);
    toast.success('Investimento removido');
    await fetchAccounts();
  }, [fetchAccounts]);

  const transfer = useCallback(async (payload: TransferPayload) => {
    await api.post('/accounts/transfer', payload);
    toast.success('Transferência realizada');
    await fetchAccounts();
  }, [fetchAccounts]);

  const getEntries = useCallback(async (accountId: string): Promise<AccountEntry[]> => {
    return api.get<AccountEntry[]>(`/accounts/${accountId}/entries`);
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalInvested = accounts.reduce(
    (sum, a) => sum + a.investments.reduce((s, i) => s + Number(i.amount), 0),
    0,
  );
  const totalNet = totalBalance + totalInvested;

  return {
    accounts,
    isLoading,
    error,
    totalBalance,
    totalInvested,
    totalNet,
    createAccount,
    updateAccount,
    removeAccount,
    createInvestment,
    updateInvestment,
    removeInvestment,
    transfer,
    getEntries,
    refetch: fetchAccounts,
  };
}