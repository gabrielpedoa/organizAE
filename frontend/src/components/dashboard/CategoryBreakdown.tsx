import { useState } from 'react';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, X, ChevronRight } from 'lucide-react';
import { BudgetItem } from '@/lib/types';

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
      if (item.installmentNumber && item.installmentNumber > 1) {
        return <Badge variant="outline">Parcelado</Badge>;
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

  const handleListClick = (category: CategoryData) => {
    setSelectedCategory(category);
    setDrawerOpen(true);
  };

  const rankedCategories = [...expenseCategories].sort((a, b) => b.realized - a.realized);
  const maxRealized = Math.max(...rankedCategories.map(c => c.realized));

  const getColorByIndex = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
    return colors[index % colors.length];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankedCategories.map((cat, index) => {
              const percentage = maxRealized > 0 ? (cat.realized / maxRealized) * 100 : 0;
              return (
                <div
                  key={cat.category.id}
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => handleListClick(cat)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{cat.category.name}</span>
                    <span className="text-sm">{formatCurrency(cat.realized)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getColorByIndex(index),
                      }}
                    ></div>
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