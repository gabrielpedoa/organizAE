import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, X } from 'lucide-react';

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

interface CategoryData {
  category: { id: string; name: string; type: string };
  planned: number;
  realized: number;
  items: BudgetItem[];
}

interface Props {
  categories: CategoryData[];
  month: number;
  year: number;
}

export function CategoryBreakdown({ categories, month, year }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const expenseCategories = categories.filter(c => c.category.type === 'EXPENSE');
  const totalExpense = expenseCategories.reduce((sum, c) => sum + c.realized, 0);

  // Generate colors for pie chart
  const colors = expenseCategories.map((_, index) => {
    const hue = (index * 137.5) % 360; // Golden angle approximation for distinct colors
    return `hsl(${hue}, 70%, 50%)`;
  });

  const pieData = expenseCategories.map((cat, index) => ({
    name: cat.category.name,
    value: cat.realized,
    color: colors[index],
    percentage: totalExpense > 0 ? (cat.realized / totalExpense) * 100 : 0,
  }));

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

  const handlePieClick = (data: any) => {
    if (data && data.name) {
      const category = expenseCategories.find(c => c.category.name === data.name);
      if (category) {
        setSelectedCategory(category);
        setDrawerOpen(true);
      }
    }
  };

  const handleListClick = (category: CategoryData) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      onClick={handlePieClick}
                      cursor="pointer"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => label}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {expenseCategories.map((cat, index) => (
                <div
                  key={cat.category.id}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                  onClick={() => handleListClick(cat)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index] }}
                    ></div>
                    <span className="text-sm">{cat.category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(cat.realized)}</div>
                    <div className="text-xs text-muted-foreground">
                      {totalExpense > 0 ? ((cat.realized / totalExpense) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Lançamentos — {selectedCategory?.category.name} — {capitalizedMonth} {year}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {selectedCategory?.items.map((item) => (
              <div key={item.id} className="p-3 border rounded">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.description}</span>
                  </div>
                  {getItemBadge(item)}
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {item.member.name}
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
            {selectedCategory?.items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum lançamento</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}