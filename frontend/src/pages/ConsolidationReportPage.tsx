import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useConsolidationReport } from '@/hooks/useConsolidationReport';
import { BudgetItem, ExpenseType } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  FIXED: 'Fixa',
  VARIABLE: 'Variável',
  INVESTMENT: 'Investimento',
  TRANSFER: 'Transferência',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function SummaryCard({
  label,
  planned,
  realized,
  colorClass,
}: {
  label: string;
  planned: number;
  realized: number;
  colorClass: string;
}) {
  const diff = realized - planned;
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-lg font-bold', colorClass)}>{formatCurrency(realized)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Previsto: {formatCurrency(planned)}
        </p>
        {Math.abs(diff) > 0.001 && (
          <p className={cn('text-xs font-medium mt-0.5', diff < 0 ? 'text-amber-600' : 'text-green-600')}>
            {diff > 0 ? '+' : ''}{formatCurrency(diff)} vs previsto
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ItemTable({ items, title }: { items: BudgetItem[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2 font-medium">Descrição</th>
              <th className="text-left p-2 font-medium">Categoria</th>
              <th className="text-left p-2 font-medium">Membro</th>
              <th className="text-left p-2 font-medium">Tipo despesa</th>
              <th className="text-right p-2 font-medium">Previsto</th>
              <th className="text-right p-2 font-medium">Realizado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isIncome = item.type === 'INCOME';
              return (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-muted-foreground">{item.category?.name ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">{item.member?.name ?? '—'}</td>
                  <td className="p-2 text-muted-foreground">
                    {item.expenseType ? EXPENSE_TYPE_LABELS[item.expenseType] : '—'}
                  </td>
                  <td className={cn('p-2 text-right', isIncome ? 'text-green-600' : 'text-red-600')}>
                    {formatCurrency(Number(item.amount))}
                  </td>
                  <td className={cn('p-2 text-right font-medium', isIncome ? 'text-green-700' : 'text-red-700')}>
                    {item.transaction ? formatCurrency(Number(item.transaction.amount)) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConsolidationReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { summary, isLoading, error } = useConsolidationReport(id ?? '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse bg-muted rounded" />
          <div className="h-7 w-64 animate-pulse bg-muted rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{error ?? 'Relatório não encontrado.'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/consolidation')}>
          Voltar
        </Button>
      </div>
    );
  }

  const allItems = [...summary.items.pending, ...summary.items.paid, ...summary.items.cancelled];
  const expenseItems = allItems.filter((i) => i.type === 'EXPENSE' && i.status !== 'CANCELLED');

  // Group expense items by ExpenseType
  const byExpenseType = new Map<string, BudgetItem[]>();
  for (const item of expenseItems) {
    const key = item.expenseType ?? 'SEM_TIPO';
    if (!byExpenseType.has(key)) byExpenseType.set(key, []);
    byExpenseType.get(key)!.push(item);
  }

  const monthLabel = `${MONTH_NAMES[summary.period.month - 1]} ${summary.period.year}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/consolidation')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Relatório — {monthLabel}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Lock className="h-3 w-3" />
            {summary.closedAt
              ? `Fechado em ${formatDate(summary.closedAt)}`
              : 'Período fechado'}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Receitas"
          planned={summary.income.planned}
          realized={summary.income.realized}
          colorClass="text-green-700"
        />
        <SummaryCard
          label="Despesas"
          planned={summary.expense.planned}
          realized={summary.expense.realized}
          colorClass="text-red-700"
        />
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo realizado</p>
            <p className={cn('text-lg font-bold', summary.balance.realized >= 0 ? 'text-green-700' : 'text-red-700')}>
              {formatCurrency(summary.balance.realized)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Previsto: {formatCurrency(summary.balance.planned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Itens confirmados</p>
            <p className="text-lg font-bold">{summary.items.paid.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.items.pending.length} pendente(s) · {summary.items.cancelled.length} cancelado(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by type */}
      {byExpenseType.size > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-red-500" /> Despesas por tipo
          </h3>
          {Array.from(byExpenseType.entries()).map(([key, items]) => {
            const label = key === 'SEM_TIPO'
              ? 'Sem tipo definido'
              : EXPENSE_TYPE_LABELS[key as ExpenseType];
            const totalPlanned = items.reduce((s, i) => s + Number(i.amount), 0);
            const totalRealized = items
              .filter((i) => i.transaction)
              .reduce((s, i) => s + Number(i.transaction!.amount), 0);
            return (
              <div key={key} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm">
                    <span className="text-muted-foreground">Previsto </span>
                    <span className="font-semibold text-red-600">{formatCurrency(totalPlanned)}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span className="text-muted-foreground">Realizado </span>
                    <span className="font-semibold text-red-700">{formatCurrency(totalRealized)}</span>
                  </span>
                </div>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex-1 truncate">{item.description}</span>
                      <span>{item.member?.name}</span>
                      <span className={cn('font-medium', item.transaction ? 'text-red-700' : 'text-muted-foreground')}>
                        {item.transaction ? formatCurrency(Number(item.transaction.amount)) : `(${formatCurrency(Number(item.amount))} previsto)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full item table */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ArrowUpCircle className="h-4 w-4 text-green-500" /> Receitas confirmadas
        </h3>
        <ItemTable
          items={summary.items.paid.filter((i) => i.type === 'INCOME')}
          title=""
        />

        <h3 className="font-semibold flex items-center gap-2 pt-2">
          <ArrowDownCircle className="h-4 w-4 text-red-500" /> Despesas confirmadas
        </h3>
        <ItemTable
          items={summary.items.paid.filter((i) => i.type === 'EXPENSE')}
          title=""
        />

        {summary.items.cancelled.length > 0 && (
          <>
            <h3 className="font-semibold text-muted-foreground pt-2">Cancelados</h3>
            <ItemTable items={summary.items.cancelled} title="" />
          </>
        )}
      </div>
    </div>
  );
}
