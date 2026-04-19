import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { cn, dateToUTC } from '@/lib/utils';
import { Category, Member, TransactionRuleFull } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  rule: TransactionRuleFull | null;
  members: Member[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditRuleModal({ rule, members, categories, onClose, onSaved }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('MONTHLY');
  const [isVariable, setIsVariable] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);
  const [memberId, setMemberId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rule) return;
    setDescription(rule.description);
    setAmount(String(rule.amount));
    setStartDate(rule.startDate.split('T')[0]);
    setEndDate(rule.endDate ? rule.endDate.split('T')[0] : '');
    setRecurrence(rule.recurrence ?? 'MONTHLY');
    setIsVariable(rule.isVariable);
    setTotalInstallments(rule.totalInstallments ?? 2);
    setMemberId(rule.memberId);
    setCategoryId(rule.categoryId);
    setExpenseType(rule.expenseType ?? '');
    setError(null);
  }, [rule]);

  if (!rule) return null;

  const isInstallment = rule.ruleType === 'INSTALLMENT';
  const isExpense = rule.type === 'EXPENSE';
  const title = rule.type === 'INCOME' ? 'Editar Entrada' : 'Editar Saída';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/transactions/rules/${rule.id}`, {
        description,
        amount: Number(amount),
        memberId,
        categoryId,
        expenseType: isExpense && expenseType ? expenseType : null,
        ...(isInstallment
          ? { totalInstallments }
          : {
              recurrence,
              isVariable,
              endDate: endDate ? dateToUTC(endDate) : null,
            }),
        startDate: dateToUTC(startDate),
      });
      toast.success('Regra atualizada');
      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
          <span>
            Tipo:{' '}
            <span className="font-medium text-foreground">
              {rule.type === 'INCOME' ? 'Entrada' : 'Saída'}
            </span>
          </span>
          <span className="border-l pl-3">
            Modalidade:{' '}
            <span className="font-medium text-foreground">
              {isInstallment ? 'Parcelado' : 'Recorrente'}
            </span>
          </span>
          <span className="border-l pl-3 text-amber-600 italic">
            Estes campos não podem ser alterados
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{isVariable ? 'Valor estimado (R$)' : 'Valor (R$)'}</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Data de início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          {!isInstallment && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Periodicidade</Label>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>
                    Data de fim{' '}
                    <span className="text-muted-foreground text-xs">(opcional)</span>
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVariable(!isVariable)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                  isVariable
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted',
                )}
              >
                <span>
                  Valor variável{' '}
                  <span className="text-xs opacity-70">(ex: conta de luz)</span>
                </span>
                <span
                  className={cn(
                    'h-4 w-8 rounded-full transition-colors relative',
                    isVariable ? 'bg-amber-400' : 'bg-muted-foreground/30',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                      isVariable ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                  />
                </span>
              </button>
            </>
          )}

          {isInstallment && (
            <div className="space-y-1">
              <Label>Número de parcelas</Label>
              <Input
                type="number"
                min={1}
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Membro</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.type === rule.type)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {isExpense && (
            <div className="space-y-1">
              <Label>Tipo de despesa</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixa</SelectItem>
                  <SelectItem value="VARIABLE">Variável</SelectItem>
                  <SelectItem value="INVESTMENT">Investimento</SelectItem>
                  <SelectItem value="TRANSFER">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
