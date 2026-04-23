import { ExpenseType, AccountType, InvestmentProductType } from '@/lib/types';

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  FIXED: 'Fixa',
  VARIABLE: 'Variável',
  INVESTMENT: 'Investimento',
  TRANSFER: 'Transferência',
};

export const RECURRENCE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  YEARLY: 'Anual',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS: 'Poupança',
  BUSINESS: 'Conta PJ',
  INVESTMENT: 'Conta Investimento',
  OTHER: 'Outra',
};

export const INVESTMENT_PRODUCT_TYPE_LABELS: Record<InvestmentProductType, string> = {
  SAVINGS_BOX: 'Caixinha / Cofrinho',
  FIXED_INCOME: 'Renda Fixa (CDB, Tesouro, LCI)',
  STOCK: 'Ações / FIIs',
  FUND: 'Fundo de Investimento',
  OTHER: 'Outro',
};

export const ACCOUNT_ENTRY_TYPE_LABELS = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER_IN: 'Transferência recebida',
  TRANSFER_OUT: 'Transferência enviada',
};
