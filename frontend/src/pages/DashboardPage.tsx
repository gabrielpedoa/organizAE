import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, currentMonth } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Summary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byMember: { memberId: string; name: string; total: number }[];
  byCategory: { categoryId: string; name: string; type: string; total: number }[];
};

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api.get(`/summary?month=${month}`).then(setSummary).catch(() => null);
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalIncome ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalExpense ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary?.balance ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Gastos por membro</CardTitle></CardHeader>
          <CardContent>
            {summary?.byMember.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            <div className="space-y-2">
              {summary?.byMember.map((m) => (
                <div key={m.memberId} className="flex justify-between text-sm">
                  <span>{m.name}</span>
                  <span className="font-medium text-red-600">{formatCurrency(m.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Por categoria</CardTitle></CardHeader>
          <CardContent>
            {summary?.byCategory.length === 0 && <p className="text-sm text-muted-foreground">Sem dados</p>}
            <div className="space-y-2">
              {summary?.byCategory.map((c) => (
                <div key={`${c.categoryId}-${c.type}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={c.type === 'INCOME' ? 'income' : 'expense'}>{c.type === 'INCOME' ? '+' : '-'}</Badge>
                    <span>{c.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
