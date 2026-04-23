import {
  CategoryBreakdown,
  DailyFlowChart,
  MemberBreakdown,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthNavigator } from "@/components/ui/MonthNavigator";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";

interface EmptyDashboardProps {
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
  onNavigate: (delta: number) => void;
  getStatusBadge: () => React.ReactNode;
}

function EmptyDashboard({
  selectedMonth,
  selectedYear,
  isLoading,
  onNavigate,
  getStatusBadge,
}: EmptyDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNavigator
            month={selectedMonth}
            year={selectedYear}
            onNavigate={onNavigate}
            disabled={isLoading}
          />
          {getStatusBadge()}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          'Receita Prevista',
          'Receita Realizada',
          'Despesa Prevista',
          'Despesa Realizada',
          'Saldo Previsto',
          'Saldo Realizado',
        ].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">
                {formatCurrency(0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Nenhuma consolidação encontrada para este período. Acesse
          Consolidação Mensal para iniciar o mês.
        </p>
        <Button asChild>
          <Link to="/consolidation">Ir para Consolidação</Link>
        </Button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const {
    selectedMonth,
    selectedYear,
    setMonth,
    setYear,
    consolidation,
    summary,
    dailyFlow,
    isLoading,
    error,
  } = useDashboard();

  const navigateMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const getStatusBadge = () => {
    if (!consolidation)
      return <Badge variant="outline">Sem consolidação</Badge>;
    if (consolidation.status === "CLOSED")
      return <Badge variant="secondary">FECHADO</Badge>;
    return <Badge variant="default">ABERTO</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <EmptyDashboard
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        isLoading={isLoading}
        onNavigate={navigateMonth}
        getStatusBadge={getStatusBadge}
      />
    );
  }

  const incomeDiff = summary.income.realized - summary.income.planned;
  const expenseDiff = summary.expense.realized - summary.expense.planned;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNavigator
            month={selectedMonth}
            year={selectedYear}
            onNavigate={navigateMonth}
            disabled={isLoading}
          />
          {getStatusBadge()}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Prevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.income.planned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Realizada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.income.realized)}
            </p>
            <p
              className={`text-xs ${incomeDiff >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {incomeDiff >= 0 ? "+" : ""}
              {formatCurrency(incomeDiff)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesa Prevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.expense.planned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesa Realizada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.expense.realized)}
            </p>
            <p
              className={`text-xs ${expenseDiff <= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {expenseDiff <= 0 ? "+" : ""}
              {formatCurrency(-expenseDiff)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Previsto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${summary.balance.planned >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary.balance.planned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${summary.balance.realized >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary.balance.realized)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de fluxo diário */}
      {dailyFlow && (
        <DailyFlowChart
          data={dailyFlow}
          month={selectedMonth}
          year={selectedYear}
        />
      )}

      {/* Gastos por Membro e Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[420px] md:h-[480px] flex flex-col">
          {summary.byMember && (
            <MemberBreakdown
              members={summary.byMember}
              month={selectedMonth}
              year={selectedYear}
            />
          )}
        </div>
        <div className="h-[420px] md:h-[480px] flex flex-col">
          {summary.byCategory && (
            <CategoryBreakdown
              categories={summary.byCategory}
              month={selectedMonth}
              year={selectedYear}
            />
          )}
        </div>
      </div>
    </div>
  );
}
