import { useState } from 'react';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, X, Receipt, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  type: string;
  installmentNumber?: number;
  totalInstallments?: number;
  ruleId?: string;
  member: { id: string; name: string };
  category: { id: string; name: string; type: string };
  transaction?: { id: string; amount: number; date: string; note?: string };
}

interface MemberData {
  member: { id: string; name: string };
  planned: number;
  realized: number;
  items: BudgetItem[];
}

interface Props {
  members: MemberData[];
  month: number;
  year: number;
}

export function MemberBreakdown({ members, month, year }: Props) {
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PAID':
      case 'RECEIVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <X className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getItemBadge = (item: BudgetItem) => {
    if (item.ruleId) {
      if (item.totalInstallments && item.totalInstallments > 1) {
        return <Badge variant="outline">Parcelado ({item.installmentNumber}/{item.totalInstallments})</Badge>;
      }
      return <Badge variant="outline">Recorrente</Badge>;
    }
    return <Badge variant="outline">Exclusivo do mês</Badge>;
  };

  const formatDueDate = (date: string, status: string, transaction?: { date: string }) => {
    if (status === 'PAID' || status === 'RECEIVED') {
      return `pago em ${formatDateOnly(transaction!.date)}`;
    }
    return `vence ${formatDateOnly(date)}`;
  };

  const expenseItems = selectedMember?.items.filter(i => i.type === 'EXPENSE') || [];
  const incomeItems = selectedMember?.items.filter(i => i.type === 'INCOME') || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por Membro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const percentage = member.planned > 0 ? (member.realized / member.planned) * 100 : 0;
              return (
                <div
                  key={member.member.id}
                  className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedMember(member);
                    setDrawerOpen(true);
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{member.member.name}</span>
                  </div>
                  <Progress value={percentage} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>Realizado: {formatCurrency(member.realized)}</span>
                    <span>Previsto: {formatCurrency(member.planned)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lançamentos — {selectedMember?.member.name} — {capitalizedMonth} {year}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Despesas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <h4 className="font-medium">Despesas</h4>
              </div>
              <div className="space-y-3">
                {expenseItems.map((item) => (
                  <div key={item.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.description}</span>
                      </div>
                      {getItemBadge(item)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {item.category.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDueDate(item.dueDate, item.status, item.transaction)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="text-sm">Previsto: {formatCurrency(item.amount)}</div>
                        {item.transaction && (
                          <div className="text-sm text-green-600">
                            Real: {formatCurrency(item.transaction.amount)}
                            {item.transaction.amount !== item.amount && (
                              <span className="ml-1">
                                ({item.transaction.amount > item.amount ? '+' : ''}{formatCurrency(item.transaction.amount - item.amount)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {expenseItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma despesa</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total Despesas:</span>
                  <span className="text-red-600">{formatCurrency(expenseItems.reduce((sum, i) => sum + (i.transaction?.amount || i.amount), 0))}</span>
                </div>
              </div>
            </div>

            {/* Receitas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Receitas</h4>
              </div>
              <div className="space-y-3">
                {incomeItems.map((item) => (
                  <div key={item.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-medium">{item.description}</span>
                      </div>
                      {getItemBadge(item)}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {item.category.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDueDate(item.dueDate, item.status, item.transaction)}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="text-sm">Previsto: {formatCurrency(item.amount)}</div>
                        {item.transaction && (
                          <div className="text-sm text-green-600">
                            Real: {formatCurrency(item.transaction.amount)}
                            {item.transaction.amount !== item.amount && (
                              <span className="ml-1">
                                ({item.transaction.amount > item.amount ? '+' : ''}{formatCurrency(item.transaction.amount - item.amount)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {incomeItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma receita</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total Receitas:</span>
                  <span className="text-green-600">{formatCurrency(incomeItems.reduce((sum, i) => sum + (i.transaction?.amount || i.amount), 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}