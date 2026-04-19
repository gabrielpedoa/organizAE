import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BudgetItem } from '@/lib/types';
import { UpdateBudgetItemPayload } from '@/hooks/useConsolidation';
import { dateToUTC } from '@/lib/utils';

interface Props {
  item: BudgetItem | null;
  onClose: () => void;
  onSave: (payload: UpdateBudgetItemPayload) => Promise<void>;
}

function toDateInput(iso: string) {
  return iso.split('T')[0];
}

export function EditBudgetItemModal({ item, onClose, onSave }: Props) {
  const [description, setDescription] = useState(item?.description ?? '');
  const [amount, setAmount] = useState(item ? String(item.amount) : '');
  const [dueDate, setDueDate] = useState(item ? toDateInput(item.dueDate) : '');
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        description: description || undefined,
        amount: parseFloat(amount) || undefined,
        dueDate: dueDate ? dateToUTC(dueDate) : undefined,
      });
      onClose();
    } catch {
      // error already toasted by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar item previsto</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Alterações afetam apenas este período — a regra original não é modificada.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Valor previsto (R$)</Label>
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
            <Label>Data de vencimento</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
