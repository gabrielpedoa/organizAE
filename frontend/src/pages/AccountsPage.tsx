import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wallet, TrendingUp, TrendingDown, ArrowLeftRight, Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, History, Building2, User } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { ACCOUNT_TYPE_LABELS, INVESTMENT_PRODUCT_TYPE_LABELS, ACCOUNT_ENTRY_TYPE_LABELS } from '@/lib/constants';
import { Account, AccountEntry, InvestmentPosition, Member } from '@/lib/types';
import { useAccounts, CreateAccountPayload, UpdateAccountPayload, CreateInvestmentPayload, UpdateInvestmentPayload, TransferPayload } from '@/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// ─── Create Account Modal ─────────────────────────────────────────────────────

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateAccountPayload) => Promise<void>;
  members: Member[];
}

function CreateAccountModal({ open, onClose, onSave, members }: CreateAccountModalProps) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setName('');
      setInstitution('');
      setType('');
      setInitialBalance('');
      setSelectedMembers([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name,
        type,
        institution,
        initialBalance: initialBalance || undefined,
        memberIds: selectedMembers.length > 0 ? selectedMembers : undefined,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome da conta *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank" required />
          </div>
          <div className="space-y-1">
            <Label>Instituição *</Label>
            <Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex: Nubank" required />
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger><SelectValue placeholder="Selecionar tipo..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Saldo inicial</Label>
            <Input type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0,00" />
          </div>
          {members.length > 0 && (
            <div className="space-y-1">
              <Label>Vincular membros</Label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`px-2 py-1 text-xs rounded-full border ${selectedMembers.includes(m.id) ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>Criar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Account Modal ─────────────────────────────────────────────────────

interface EditAccountModalProps {
  account: Account | null;
  onClose: () => void;
  onSave: (payload: UpdateAccountPayload) => Promise<void>;
}

function EditAccountModal({ account, onClose, onSave }: EditAccountModalProps) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setInstitution(account.institution);
      setType(account.type);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ name, type, institution });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!account} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome da conta *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Instituição *</Label>
            <Input value={institution} onChange={e => setInstitution(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Investment Modal ─────────────────────────────────────────────────────

interface AddInvestmentModalProps {
  account: Account | null;
  onClose: () => void;
  onSave: (accountId: string, payload: CreateInvestmentPayload) => Promise<void>;
}

function AddInvestmentModal({ account, onClose, onSave }: AddInvestmentModalProps) {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) {
      setName('');
      setProductType('');
      setAmount('');
      setNote('');
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    try {
      await onSave(account.id, { name, productType, amount, note: note || undefined });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar investimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!account} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Investimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tesouro Direto" required />
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={productType} onValueChange={setProductType} required>
              <SelectTrigger><SelectValue placeholder="Selecionar tipo..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(INVESTMENT_PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Valor atual *</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required />
          </div>
          <div className="space-y-1">
            <Label>Observação</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Resgate em 2027" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>Adicionar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Investment Modal ─────────────────────────────────────────────────────

interface EditInvestmentModalProps {
  investment: InvestmentPosition | null;
  onClose: () => void;
  onSave: (payload: UpdateInvestmentPayload) => Promise<void>;
}

function EditInvestmentModal({ investment, onClose, onSave }: EditInvestmentModalProps) {
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setProductType(investment.productType);
      setAmount(String(investment.amount));
      setNote(investment.note || '');
    }
  }, [investment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ name, productType, amount, note: note || undefined });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar investimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!investment} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Investimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select value={productType} onValueChange={setProductType} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(INVESTMENT_PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Valor atual *</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Observação</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer Modal ─────────────────────────────────────────────────────

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: TransferPayload) => Promise<void>;
  accounts: Account[];
}

function TransferModal({ open, onClose, onSave, accounts }: TransferModalProps) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNote('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        fromAccountId,
        toAccountId,
        amount,
        date,
        description: description || undefined,
        note: note || undefined,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao transferir');
    } finally {
      setLoading(false);
    }
  };

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccounts = accounts.filter(a => a.id !== fromAccountId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Conta origem *</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId} required>
              <SelectTrigger><SelectValue placeholder="Selecionar conta..." /></SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <span className="flex items-center justify-between w-full gap-4">
                      <span>{account.name}</span>
                      <span className="text-muted-foreground text-xs">{formatCurrency(Number(account.balance))}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromAccount && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: <span className={Number(fromAccount.balance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Number(fromAccount.balance))}
                </span>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Conta destino *</Label>
            <Select value={toAccountId} onValueChange={setToAccountId} required>
              <SelectTrigger><SelectValue placeholder="Selecionar conta..." /></SelectTrigger>
              <SelectContent>
                {toAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Valor *</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required />
          </div>
          <div className="space-y-1">
            <Label>Data *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Transferência entre contas" />
          </div>
          <div className="space-y-1">
            <Label>Observação</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>Transferir</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Entries Modal ─────────────────────────────────────────────────────

interface AccountEntriesModalProps {
  account: Account | null;
  onClose: () => void;
  getEntries: (accountId: string) => Promise<AccountEntry[]>;
}

function AccountEntriesModal({ account, onClose, getEntries }: AccountEntriesModalProps) {
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setLoading(true);
      getEntries(account.id)
        .then(setEntries)
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    }
  }, [account, getEntries]);

  const getEntryIcon = (type: AccountEntry['type']) => {
    switch (type) {
      case 'INCOME': return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case 'EXPENSE': return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case 'TRANSFER_IN': return <ArrowUpCircle className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER_OUT': return <ArrowDownCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getEntryAmountClass = (type: AccountEntry['type']) => {
    switch (type) {
      case 'INCOME':
      case 'TRANSFER_IN': return 'text-green-600';
      case 'EXPENSE':
      case 'TRANSFER_OUT': return 'text-red-600';
    }
  };

  const formatEntryAmount = (entry: AccountEntry) => {
    const isPositive = entry.type === 'INCOME' || entry.type === 'TRANSFER_IN';
    return `${isPositive ? '+' : '-'}${formatCurrency(entry.amount)}`;
  };

  return (
    <Dialog open={!!account} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extrato - {account?.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma movimentação encontrada</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getEntryIcon(entry.type)}
                  <div>
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={`font-medium ${getEntryAmountClass(entry.type)}`}>
                  {formatEntryAmount(entry)}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  onViewEntries: () => void;
  onAddInvestment: () => void;
  onEditInvestment: (inv: InvestmentPosition) => void;
  onDeleteInvestment: (id: string) => void;
}

function AccountCard({ account, onEdit, onDelete, onViewEntries, onAddInvestment, onEditInvestment, onDeleteInvestment }: AccountCardProps) {
  const totalInvested = account.investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const available = Number(account.balance);
  const totalOnAccount = available + totalInvested;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {account.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate">{account.institution}</p>
          </div>
          <span className="shrink-0 px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full whitespace-nowrap">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 flex-1">

        {/* Saldos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Disponível</span>
            <span className={cn('font-semibold', available >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(available)}
            </span>
          </div>
          {totalInvested > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Investido</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(totalInvested)}
              </span>
            </div>
          )}
          {totalInvested > 0 && (
            <>
              <div className="border-t pt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Total na conta</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totalOnAccount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Investimentos */}
        {account.investments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Investimentos
            </p>
            {account.investments.map(inv => (
              <div key={inv.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {INVESTMENT_PRODUCT_TYPE_LABELS[inv.productType]}
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600 shrink-0">
                  {formatCurrency(Number(inv.amount))}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Editar investimento ${inv.name}`}
                    onClick={() => onEditInvestment(inv)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label={`Remover investimento ${inv.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover investimento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove "{inv.name}" da conta. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => onDeleteInvestment(inv.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Membros */}
        {account.members.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {account.members.map(m => (
              <span
                key={m.memberId}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
              >
                <User className="h-3 w-3" />
                {m.member.name}
              </span>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2 pt-1 mt-auto">
          <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={onViewEntries}>
            <History className="h-3.5 w-3.5 mr-1.5" /> Extrato
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={onAddInvestment}>
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Investimento
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação removerá a conta e todo seu histórico de movimentações. Não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export function AccountsPage() {
  const {
    accounts, isLoading, totalBalance, totalInvested, totalNet,
    createAccount, updateAccount, removeAccount,
    createInvestment, updateInvestment, removeInvestment,
    transfer, getEntries,
  } = useAccounts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [addInvestmentAccount, setAddInvestmentAccount] = useState<Account | null>(null);
  const [editInvestment, setEditInvestment] = useState<InvestmentPosition | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [entriesAccount, setEntriesAccount] = useState<Account | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    api.get<Member[]>('/members')
      .then(setMembers)
      .catch(() => {});
  }, []);

  const handleCreateAccount = async (payload: CreateAccountPayload) => {
    await createAccount(payload);
    setCreateOpen(false);
  };

  const handleUpdateAccount = async (payload: UpdateAccountPayload) => {
    if (!editAccount) return;
    await updateAccount(editAccount.id, payload);
    setEditAccount(null);
  };

  const handleRemoveAccount = async (id: string) => {
    await removeAccount(id);
  };

  const handleAddInvestment = async (accountId: string, payload: CreateInvestmentPayload) => {
    await createInvestment(accountId, payload);
    setAddInvestmentAccount(null);
  };

  const handleUpdateInvestment = async (payload: UpdateInvestmentPayload) => {
    if (!editInvestment) return;
    await updateInvestment(editInvestment.id, payload);
    setEditInvestment(null);
  };

  const handleRemoveInvestment = async (id: string) => {
    await removeInvestment(id);
  };

  const handleTransfer = async (payload: TransferPayload) => {
    await transfer(payload);
    setTransferOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-24 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="hidden md:flex text-2xl font-bold items-center gap-2">
          <Wallet className="h-6 w-6" /> Contas
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Transferência</span>
            <span className="sm:hidden">Transferir</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova conta
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Disponível total</p>
            <p className={cn('text-xl font-bold', totalBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total investido</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Patrimônio total</p>
            <p className={cn('text-xl font-bold', totalNet >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(totalNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhuma conta cadastrada</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar primeira conta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => setEditAccount(account)}
              onDelete={() => handleRemoveAccount(account.id)}
              onViewEntries={() => setEntriesAccount(account)}
              onAddInvestment={() => setAddInvestmentAccount(account)}
              onEditInvestment={setEditInvestment}
              onDeleteInvestment={handleRemoveInvestment}
            />
          ))}
        </div>
      )}

      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateAccount}
        members={members}
      />

      <EditAccountModal
        account={editAccount}
        onClose={() => setEditAccount(null)}
        onSave={handleUpdateAccount}
      />

      <AddInvestmentModal
        account={addInvestmentAccount}
        onClose={() => setAddInvestmentAccount(null)}
        onSave={handleAddInvestment}
      />

      <EditInvestmentModal
        investment={editInvestment}
        onClose={() => setEditInvestment(null)}
        onSave={handleUpdateInvestment}
      />

      <TransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSave={handleTransfer}
        accounts={accounts}
      />

      <AccountEntriesModal
        account={entriesAccount}
        onClose={() => setEntriesAccount(null)}
        getEntries={getEntries}
      />
    </div>
  );
}