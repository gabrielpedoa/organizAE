import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Category, ExpenseType, Member, TransactionType } from '@/lib/types';
import { AddBudgetItemPayload } from '@/hooks/useConsolidation';
import { dateToUTC } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: AddBudgetItemPayload) => Promise<void>;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function AddBudgetItemModal({ open, onClose, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());
  const [memberId, setMemberId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get<Member[]>('/members'),
      api.get<Category[]>('/categories'),
    ])
      .then(([m, c]) => { setMembers(m); setCategories(c); })
      .catch(() => toast.error('Erro ao carregar membros/categorias'));
  }, [open]);

  // Auto-select first member/category of matching type when type changes
  useEffect(() => {
    const filtered = categories.filter((c) => c.type === type);
    if (filtered.length && !filtered.find((c) => c.id === categoryId)) {
      setCategoryId(filtered[0].id);
    }
  }, [type, categories, categoryId]);

  useEffect(() => {
    if (members.length && !memberId) setMemberId(members[0].id);
  }, [members, memberId]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const resetForm = () => {
    setType('EXPENSE');
    setDescription('');
    setAmount('');
    setDueDate(todayISO());
    setMemberId('');
    setCategoryId('');
    setExpenseType('');
    setNote('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !categoryId) {
      toast.error('Selecione membro e categoria');
      return;
    }
    if (type === 'EXPENSE' && !expenseType) {
      toast.error('Selecione o tipo de despesa');
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        type,
        description,
        amount: parseFloat(amount),
        dueDate: dateToUTC(dueDate),
        memberId,
        categoryId,
        expenseType: type === 'EXPENSE' && expenseType ? expenseType : undefined,
        note: note || undefined,
      });
      resetForm();
      onClose();
    } catch {
      // error toasted by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo item avulso</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Item sem vínculo com regra recorrente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => { setType(v as TransactionType); setExpenseType(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'EXPENSE' && (
            <div className="space-y-1">
              <Label>Tipo de despesa</Label>
              <Select value={expenseType} onValueChange={(v) => setExpenseType(v as ExpenseType)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED">Fixa</SelectItem>
                  <SelectItem value="VARIABLE">Variável</SelectItem>
                  <SelectItem value="INVESTMENT">Investimento</SelectItem>
                  <SelectItem value="TRANSFER">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Consulta médica"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
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
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Membro</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Observação (opcional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: parcelado no débito"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
