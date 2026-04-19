import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, dateToUTC } from "@/lib/utils";
import { BudgetItem } from "@/lib/types";
import {
  ConfirmPaymentPayload,
  ConfirmReceiptPayload,
} from "@/hooks/useConsolidation";

interface Props {
  item: BudgetItem | null;
  onClose: () => void;
  onConfirm: (
    payload: ConfirmPaymentPayload | ConfirmReceiptPayload,
  ) => Promise<void>;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function ConfirmPaymentModal({ item, onClose, onConfirm }: Props) {
  const isExpense = item?.type === "EXPENSE";
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const realAmount = parseFloat(amount) || 0;
  const diff = realAmount - Number(item.amount);
  const hasDiff = Math.abs(diff) > 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isoDate = dateToUTC(date);
      const payload = isExpense
        ? { paidAt: isoDate, amount: realAmount, note: note || undefined }
        : { receivedAt: isoDate, amount: realAmount, note: note || undefined };
      await onConfirm(payload);
      resetForms();
      onClose();
    } catch {
      // error already toasted by hook
    } finally {
      setLoading(false);
    }
  };

  function resetForms() {
    setDate(todayISO());
    setAmount("");
    setNote("");
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isExpense ? "Confirmar Pagamento" : "Confirmar Recebimento"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          {item.description}
        </p>
        <p className="text-xs text-muted-foreground">
          Previsto:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(Number(item.amount))}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label>
              {isExpense ? "Data do pagamento" : "Data do recebimento"}
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Valor real (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {hasDiff && (
              <p
                className={`text-xs font-medium ${diff < 0 ? "text-amber-600" : "text-green-600"}`}
              >
                Diferença: {diff > 0 ? "+" : ""}
                {formatCurrency(diff)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Observação (opcional)</Label>
            <Input
              placeholder="Ex: desconto aplicado"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
