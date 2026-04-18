import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AddBudgetItemModal } from '@/components/consolidation/AddBudgetItemModal';
import { ConfirmPaymentModal } from '@/components/consolidation/ConfirmPaymentModal';
import { EditBudgetItemModal } from '@/components/consolidation/EditBudgetItemModal';
import { useConsolidation, ConfirmPaymentPayload, ConfirmReceiptPayload } from '@/hooks/useConsolidation';
import { BudgetItem, BudgetItemStatus } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type Tab = 'pending' | 'paid' | 'cancelled';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  diff,
  colorClass,
}: {
  label: string;
  value: number;
  diff?: number;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-lg font-bold', colorClass)}>{formatCurrency(value)}</p>
        {diff !== undefined && Math.abs(diff) > 0.001 && (
          <p className={cn('text-xs mt-1', diff < 0 ? 'text-amber-600' : 'text-green-600')}>
            {diff > 0 ? '+' : ''}{formatCurrency(diff)} vs previsto
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingCards() {
  return (
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
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 rounded-lg border p-3">
          <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: BudgetItemStatus }) {
  const map: Record<BudgetItemStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'income' | 'expense'; cls: string }> = {
    PENDING:   { label: 'Pendente',   variant: 'secondary', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    PAID:      { label: 'Pago',       variant: 'secondary', cls: 'bg-green-100 text-green-700 border-green-200' },
    RECEIVED:  { label: 'Recebido',   variant: 'secondary', cls: 'bg-green-100 text-green-700 border-green-200' },
    CANCELLED: { label: 'Cancelado',  variant: 'secondary', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', cls)}>
      {label}
    </span>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: BudgetItem;
  onPay: (item: BudgetItem) => void;
  onEdit: (item: BudgetItem) => void;
  onCancel: (item: BudgetItem) => void;
}

function ItemRow({ item, onPay, onEdit, onCancel }: ItemRowProps) {
  const isIncome = item.type === 'INCOME';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
      {/* Type icon */}
      <div className="shrink-0">
        {isIncome
          ? <ArrowUpCircle className="h-8 w-8 text-green-500" />
          : <ArrowDownCircle className="h-8 w-8 text-red-500" />
        }
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {item.category?.name}
          {item.member && <> · {item.member.name}</>}
        </p>
        {item.status === 'PAID' || item.status === 'RECEIVED' ? (
          item.transaction && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFullDate(item.transaction.date)} · {formatCurrency(Number(item.transaction.amount))}
              {item.transaction.note && <> · <span className="italic">{item.transaction.note}</span></>}
            </p>
          )
        ) : item.status === 'CANCELLED' && item.note ? (
          <p className="text-xs text-muted-foreground italic mt-0.5">Motivo: {item.note}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            vence {formatDueDate(item.dueDate)}
          </p>
        )}
      </div>

      {/* Planned amount */}
      <div className="text-right shrink-0">
        <p className={cn('font-semibold text-sm', isIncome ? 'text-green-600' : 'text-red-600')}>
          {formatCurrency(Number(item.amount))}
        </p>
        {(item.status === 'PAID' || item.status === 'RECEIVED') && item.transaction && (
          <p className="text-xs text-muted-foreground line-through">
            previsto
          </p>
        )}
      </div>

      {/* Status */}
      <StatusBadge status={item.status} />

      {/* Actions */}
      {item.status === 'PENDING' && (
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant={isIncome ? 'outline' : 'default'} className="text-xs h-7 px-2" onClick={() => onPay(item)}>
            {isIncome ? 'Receber' : 'Pagar'}
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => onEdit(item)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            onClick={() => onCancel(item)}
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConsolidationPage() {
  const navigate = useNavigate();
  const {
    month, year, consolidation, summary, isLoading,
    confirmPayment, confirmReceipt,
    cancelItem, updateItem, addItem, closeConsolidation, navigateMonth,
  } = useConsolidation();

  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [paymentItem, setPaymentItem] = useState<BudgetItem | null>(null);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const hasPending = (summary?.items.pending.length ?? 0) > 0;
  const isClosed = consolidation?.status === 'CLOSED';

  // ── Tab list ──
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'pending',   label: 'Pendentes',   count: summary?.items.pending.length ?? 0 },
    { id: 'paid',      label: 'Confirmados', count: summary?.items.paid.length ?? 0 },
    { id: 'cancelled', label: 'Cancelados',  count: summary?.items.cancelled.length ?? 0 },
  ];

  const currentItems: BudgetItem[] =
    activeTab === 'pending'   ? (summary?.items.pending   ?? []) :
    activeTab === 'paid'      ? (summary?.items.paid      ?? []) :
                                 (summary?.items.cancelled ?? []);

  // ── Handlers ──
  const handlePay = (item: BudgetItem) => setPaymentItem(item);

  const handleEdit = (item: BudgetItem) => setEditItem(item);

  const handleCancel = async (item: BudgetItem) => {
    const reason = window.prompt('Motivo do cancelamento (opcional):') ?? undefined;
    try {
      await cancelItem(item, reason || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  };

  const handleConfirmPayment = async (
    payload: ConfirmPaymentPayload | ConfirmReceiptPayload,
  ) => {
    if (!paymentItem) return;
    if (paymentItem.type === 'INCOME') {
      await confirmReceipt(paymentItem, payload as ConfirmReceiptPayload);
    } else {
      await confirmPayment(paymentItem, payload as ConfirmPaymentPayload);
    }
  };

  const handleCloseMonth = async () => {
    if (hasPending) {
      const confirmed = window.confirm(
        `Há ${summary?.items.pending.length} item(ns) pendente(s). Fechar o período mesmo assim?`,
      );
      if (!confirmed) return;
    }
    try {
      await closeConsolidation(hasPending);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fechar');
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Consolidação Mensal</h2>
          {consolidation && (
            <span className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              isClosed
                ? 'bg-gray-100 text-gray-600 border-gray-200'
                : 'bg-blue-100 text-blue-700 border-blue-200',
            )}>
              {isClosed ? 'Fechado' : 'Aberto'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period navigator */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {consolidation && !isClosed && (
            <Button size="sm" variant="outline" onClick={handleCloseMonth} disabled={isLoading}>
              Fechar mês
            </Button>
          )}

          {consolidation && !isClosed && (
            <Button size="sm" variant="outline" onClick={() => setAddItemOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar lançamento
            </Button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <>
          <LoadingCards />
          <LoadingRows />
        </>
      )}

      {/* ── Closed-month banner ── */}
      {!isLoading && isClosed && summary?.closedAt && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Período fechado em {new Date(summary.closedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate(`/consolidation/${consolidation!.id}`)}>
            Ver relatório
          </Button>
        </div>
      )}

      {/* ── Summary cards ── */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Receitas Previstas"
            value={summary.income.planned}
            colorClass="text-green-600"
          />
          <SummaryCard
            label="Receitas Realizadas"
            value={summary.income.realized}
            diff={summary.income.realized - summary.income.planned}
            colorClass="text-green-700"
          />
          <SummaryCard
            label="Despesas Previstas"
            value={summary.expense.planned}
            colorClass="text-red-600"
          />
          <SummaryCard
            label="Despesas Realizadas"
            value={summary.expense.realized}
            diff={summary.expense.realized - summary.expense.planned}
            colorClass="text-red-700"
          />
        </div>
      )}

      {/* ── Balance strip ── */}
      {!isLoading && summary && (
        <div className="flex gap-4 rounded-lg bg-muted/40 border px-4 py-3 text-sm">
          <div>
            <span className="text-muted-foreground">Saldo previsto: </span>
            <span className={cn('font-semibold', summary.balance.planned >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(summary.balance.planned)}
            </span>
          </div>
          <div className="border-l pl-4">
            <span className="text-muted-foreground">Saldo realizado: </span>
            <span className={cn('font-semibold', summary.balance.realized >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(summary.balance.realized)}
            </span>
          </div>
          {summary.income.pending > 0 || summary.expense.pending > 0 ? (
            <div className="border-l pl-4 text-amber-600">
              {summary.expense.pending > 0 && (
                <span>{formatCurrency(summary.expense.pending)} pendente em despesas</span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ── Tabs + item list ── */}
      {!isLoading && summary && (
        <div>
          {/* Tab buttons */}
          <div className="flex border-b mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs',
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Items */}
          {currentItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum item aqui.</p>
          ) : (
            <div className="space-y-2">
              {currentItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onPay={handlePay}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <ConfirmPaymentModal
        item={paymentItem}
        onClose={() => setPaymentItem(null)}
        onConfirm={handleConfirmPayment}
      />

      <EditBudgetItemModal
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={async (payload) => {
          if (!editItem) return;
          await updateItem(editItem, payload);
          setEditItem(null);
        }}
      />

      <AddBudgetItemModal
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onAdd={async (payload) => {
          await addItem(payload);
          setAddItemOpen(false);
        }}
      />
    </div>
  );
}
