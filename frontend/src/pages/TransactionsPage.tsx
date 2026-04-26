import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Member, Category, TransactionRuleFull } from "@/lib/types";
import { formatCurrency, formatDateOnly, dateToUTC } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  X,
  RefreshCw,
  CreditCard,
  Sheet,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { EditRuleModal } from "@/components/entries/EditRuleModal";
import { RECURRENCE_LABELS } from "@/lib/constants";

type DialogMode = "recurring" | "installment";
type Props = { type: "INCOME" | "EXPENSE" };

interface BulkRow {
  _id: string;
  description: string;
  amount: string;
  date: string;
  memberId: string;
  categoryId: string;
  mode: DialogMode;
  recurrence: string;
  isVariable: boolean;
  endDate: string;
  totalInstallments: number;
  expenseType: string;
}
function RuleBadge({ rule }: { rule: TransactionRuleFull }) {
  if (rule.ruleType === "INSTALLMENT") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
        <CreditCard className="h-3 w-3" />
        Parcelado ({rule.totalInstallments}x)
      </span>
    );
  }
  if (rule.isVariable) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <RefreshCw className="h-3 w-3" /> Estimado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      <RefreshCw className="h-3 w-3" /> {RECURRENCE_LABELS[rule.recurrence ?? ""] ?? "Recorrente"}
    </span>
  );
}


function newRow(
  defaultMemberId: string,
  defaultCategoryId: string,
  type: "INCOME" | "EXPENSE",
): BulkRow {
  return {
    _id: crypto.randomUUID(),
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    memberId: defaultMemberId,
    categoryId: defaultCategoryId,
    mode: "recurring",
    recurrence: "MONTHLY",
    isVariable: false,
    endDate: "",
    totalInstallments: 2,
    expenseType: "",
  };
}

function BulkDialog({
  type,
  members,
  categories,
  onCreated,
}: {
  type: "INCOME" | "EXPENSE";
  members: Member[];
  categories: Category[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const filteredCategories = categories.filter((c) => c.type === type);
  const defaultMemberId = members[0]?.id ?? "";
  const defaultCategoryId = filteredCategories[0]?.id ?? "";

  const [rows, setRows] = useState<BulkRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setRows([newRow(defaultMemberId, defaultCategoryId, type)]);
  }, [open, defaultMemberId, defaultCategoryId, type]);

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows((prev) => [
      ...prev,
      newRow(
        last?.memberId ?? defaultMemberId,
        last?.categoryId ?? defaultCategoryId,
        type,
      ),
    ]);
  };

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const updateRow = (id: string, field: keyof BulkRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleSubmit = async () => {
    const invalid = rows.some(
      (r) =>
        !r.description || !r.amount || !r.date || !r.memberId || !r.categoryId,
    );
    if (invalid) {
      toast.error("Preencha todos os campos antes de salvar");
      return;
    }

    try {
      await Promise.all(
        rows.map((r) =>
          api.post("/transactions/rules", {
            description: r.description,
            amount: Number(r.amount),
            type,
            memberId: r.memberId,
            categoryId: r.categoryId,
            ruleType: r.mode === "recurring" ? "RECURRING" : "INSTALLMENT",
            recurrence: r.mode === "recurring" ? r.recurrence : undefined,
            isVariable: r.mode === "recurring" ? r.isVariable : false,
            startDate: dateToUTC(r.date),
            endDate: r.mode === "recurring" && r.endDate ? dateToUTC(r.endDate) : undefined,
            totalInstallments: r.mode === "installment" ? r.totalInstallments : undefined,
            expenseType: type === "EXPENSE" && r.expenseType ? r.expenseType : undefined,
          }),
        ),
      );

      toast.success(
        `${rows.length} lançamento${rows.length > 1 ? "s" : ""} criado${rows.length > 1 ? "s" : ""}`,
      );
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };
  const label = type === "INCOME" ? "entradas" : "saídas";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Sheet className="h-4 w-4 mr-1" /> Lançar em massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançamento em massa — {label}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">

          {/* Mobile: cards empilhados */}
          <div className="md:hidden space-y-3 px-1">
            {rows.map((row, idx) => (
              <div key={row._id} className="rounded-lg border p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Lançamento {idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => removeRow(row._id)}
                      aria-label="Remover linha"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(row._id, "description", e.target.value)}
                    placeholder="Descrição"
                    className="h-9 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={row.amount}
                      onChange={(e) => updateRow(row._id, "amount", e.target.value)}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Valor"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={row.date}
                      onChange={(e) => updateRow(row._id, "date", e.target.value)}
                      type="date"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Select value={row.mode} onValueChange={(v) => updateRow(row._id, "mode", v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring">Recorrente</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                  {type === "EXPENSE" && (
                    <Select value={row.expenseType} onValueChange={(v) => updateRow(row._id, "expenseType", v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Tipo de despesa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Fixa</SelectItem>
                        <SelectItem value="VARIABLE">Variável</SelectItem>
                        <SelectItem value="INVESTMENT">Investimento</SelectItem>
                        <SelectItem value="TRANSFER">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={row.memberId} onValueChange={(v) => updateRow(row._id, "memberId", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.categoryId} onValueChange={(v) => updateRow(row._id, "categoryId", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela original */}
          <div className="hidden md:block">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-muted z-10">
                <tr>
                  <th className="text-left px-2 py-2 font-medium w-[28%]">
                    Descrição
                  </th>
                  <th className="text-left px-2 py-2 font-medium w-[12%]">
                    Valor (R$)
                  </th>
                  <th className="text-left px-2 py-2 font-medium w-[13%]">
                    Data
                  </th>

                  <th className="text-left px-2 py-2 font-medium w-[12%]">
                    Tipo
                  </th>
                  {type === "EXPENSE" && (
                    <th className="text-left px-2 py-2 font-medium w-[12%]">
                      Tipo despesa
                    </th>
                  )}
                  <th className="text-left px-2 py-2 font-medium w-[20%]">
                    Membro
                  </th>
                  <th className="text-left px-2 py-2 font-medium w-[20%]">
                    Categoria
                  </th>
                  <th className="w-[7%]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row._id}
                    className={cn(
                      "border-t",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                    )}
                  >
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.description}
                        onChange={(e) =>
                          updateRow(row._id, "description", e.target.value)
                        }
                        placeholder="Ex: Conta de luz"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.amount}
                        onChange={(e) =>
                          updateRow(row._id, "amount", e.target.value)
                        }
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.date}
                        onChange={(e) =>
                          updateRow(row._id, "date", e.target.value)
                        }
                        type="date"
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        value={row.mode}
                        onValueChange={(v) => updateRow(row._id, "mode", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recurring">Recorrente</SelectItem>
                          <SelectItem value="installment">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {type === "EXPENSE" && (
                      <td className="px-2 py-1.5">
                        <Select
                          value={row.expenseType}
                          onValueChange={(v) => updateRow(row._id, "expenseType", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixa</SelectItem>
                            <SelectItem value="VARIABLE">Variável</SelectItem>
                            <SelectItem value="INVESTMENT">Investimento</SelectItem>
                            <SelectItem value="TRANSFER">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                    <td className="px-2 py-1.5">
                      <Select
                        value={row.memberId}
                        onValueChange={(v) => updateRow(row._id, "memberId", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Membro" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Select
                        value={row.categoryId}
                        onValueChange={(v) => updateRow(row._id, "categoryId", v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row._id)}
                          aria-label="Remover linha"
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button type="button" variant="ghost" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar linha
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {rows.length} linha{rows.length !== 1 ? "s" : ""}
            </span>
            <Button onClick={handleSubmit}>Salvar tudo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RuleCard({
  rule,
  type,
  onEdit,
  onRemove,
}: {
  rule: TransactionRuleFull;
  type: 'INCOME' | 'EXPENSE';
  onEdit: (rule: TransactionRuleFull) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{rule.description}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rule.category.name} · {rule.member.name}
          </p>
        </div>
        <p className={`font-semibold text-sm shrink-0 ${type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
          {type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(rule.amount))}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RuleBadge rule={rule} />
          <span className="text-xs text-muted-foreground">
            desde {formatDateOnly(rule.startDate)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`Editar regra ${rule.description}`}
            onClick={() => onEdit(rule)}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Remover regra ${rule.description}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover regra?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove a regra "{rule.description}" e todos os lançamentos vinculados a ela. Não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onRemove(rule.id)}
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export function TransactionsPage({ type }: Props) {
  const [rules, setRules] = useState<TransactionRuleFull[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterMember, setFilterMember] = useState("all");
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<TransactionRuleFull | null>(null);
  const [mode, setMode] = useState<DialogMode>("recurring");

  const [memberId, setMemberId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [recurrence, setRecurrence] = useState("MONTHLY");
  const [isVariable, setIsVariable] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState(2);

  const filteredCategories = categories.filter((c) => c.type === type);
  const label = type === "INCOME" ? "Nova regra de entrada" : "Nova regra de saída";
  const title = type === "INCOME" ? "Entradas" : "Saídas";

  // Loads all TransactionRules for this type.
  // Member filtering happens client-side via `displayedRules` below.
  const load = useCallback(() => {
    api
      .get<TransactionRuleFull[]>(`/transactions/rules?type=${type}`)
      .then(setRules)
      .catch(() => null);
  }, [type]);

  const resetForm = () => {
    setMemberId("");
    setCategoryId("");
    setExpenseType("");
    setRecurrence("MONTHLY");
    setIsVariable(false);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setTotalInstallments(2);
    setMode("recurring");
  };

  useEffect(() => {
    let cancelled = false;
    api.get<TransactionRuleFull[]>(`/transactions/rules?type=${type}`)
      .then((data) => { if (!cancelled) setRules(data); })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [type]);
  useEffect(() => {
    api.get<Member[]>("/members").then(setMembers);
    api.get<Category[]>("/categories").then(setCategories);
  }, []);

  const handleCreateRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.post("/transactions/rules", {
        description: fd.get("description") as string,
        amount: Number(fd.get("amount")),
        type,
        memberId,
        categoryId,
        ruleType: mode === "recurring" ? "RECURRING" : "INSTALLMENT",
        recurrence: mode === "recurring" ? recurrence : undefined,
        isVariable: mode === "recurring" ? isVariable : false,
        startDate: dateToUTC(startDate),
        endDate: mode === "recurring" && endDate ? dateToUTC(endDate) : undefined,
        totalInstallments:
          mode === "installment" ? totalInstallments : undefined,
        expenseType: type === "EXPENSE" && expenseType ? expenseType : undefined,
      });
      toast.success("Regra criada e lançamentos gerados");
      setOpen(false);
      resetForm();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const removeRule = async (id: string) => {
    try {
      await api.delete(`/transactions/rules/${id}`);
      toast.success("Regra removida");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover regra");
    }
  };

  // Client-side member filter (backend listRules doesn't filter by memberId)
  const displayedRules =
    filterMember === "all"
      ? rules
      : rules.filter((r) => r.memberId === filterMember);

  const modeLabel: Record<DialogMode, string> = {
    recurring: "Recorrente",
    installment: "Parcelado",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="hidden md:block text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2 ml-auto">
          <BulkDialog
            type={type}
            members={members}
            categories={categories}
            onCreated={load}
          />
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">Nova regra</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
              </DialogHeader>

              <div className="flex rounded-lg border p-1 gap-1 bg-muted/40">
                {(["recurring", "installment"] as DialogMode[]).map(
                  (m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                        mode === m
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {modeLabel[m]}
                    </button>
                  ),
                )}
              </div>

              <form
                onSubmit={handleCreateRule}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Input name="description" required />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>
                      {mode === "recurring" && isVariable
                        ? "Valor estimado (R$)"
                        : "Valor (R$)"}
                    </Label>
                    <Input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
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

                {mode === "recurring" && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Periodicidade</Label>
                        <Select
                          value={recurrence}
                          onValueChange={setRecurrence}
                        >
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
                          Data de fim{" "}
                          <span className="text-muted-foreground text-xs">
                            (opcional)
                          </span>
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
                        "w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        isVariable
                          ? "border-amber-400 bg-amber-50 text-amber-800"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <span>
                        Valor variável{" "}
                        <span className="text-xs opacity-70">
                          (ex: conta de luz)
                        </span>
                      </span>
                      <span
                        className={cn(
                          "h-4 w-8 rounded-full transition-colors relative",
                          isVariable
                            ? "bg-amber-400"
                            : "bg-muted-foreground/30",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform",
                            isVariable ? "translate-x-4" : "translate-x-0.5",
                          )}
                        />
                      </span>
                    </button>
                  </>
                )}

                {mode === "installment" && (
                  <div className="space-y-1">
                    <Label>Número de parcelas</Label>
                    <Input
                      type="number"
                      min={2}
                      value={totalInstallments}
                      onChange={(e) =>
                        setTotalInstallments(Number(e.target.value))
                      }
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Membro</Label>
                  <Select value={memberId} onValueChange={setMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {type === "EXPENSE" && (
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!memberId || !categoryId}
                >
                  Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={filterMember} onValueChange={setFilterMember}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todos membros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {displayedRules.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Nenhuma regra cadastrada
          </p>
        ) : (
          displayedRules.map((r) => (
            <RuleCard
              key={r.id}
              rule={r}
              type={type}
              onEdit={setEditRule}
              onRemove={removeRule}
            />
          ))
        )}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Desde</th>
              <th className="text-left p-3 font-medium">Descrição</th>
              <th className="text-left p-3 font-medium">Categoria</th>
              <th className="text-left p-3 font-medium">Membro</th>
              <th className="text-left p-3 font-medium">Tipo</th>
              <th className="text-right p-3 font-medium">Valor</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {displayedRules.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-6 text-muted-foreground">
                  Nenhuma regra cadastrada
                </td>
              </tr>
            )}
            {displayedRules.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/50">
                <td className="p-3">{formatDateOnly(r.startDate)}</td>
                <td className="p-3">{r.description}</td>
                <td className="p-3">{r.category.name}</td>
                <td className="p-3">{r.member.name}</td>
                <td className="p-3"><RuleBadge rule={r} /></td>
                <td className={`p-3 text-right font-medium ${type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(r.amount))}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar regra ${r.description}`}
                      onClick={() => setEditRule(r)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover regra ${r.description}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover regra?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação remove a regra "{r.description}" e todos os lançamentos vinculados a ela. Não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => removeRule(r.id)}
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditRuleModal
        rule={editRule}
        members={members}
        categories={categories}
        onClose={() => setEditRule(null)}
        onSaved={load}
      />
    </div>
  );
}
