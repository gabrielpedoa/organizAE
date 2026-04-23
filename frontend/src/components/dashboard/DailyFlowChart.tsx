import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DailyFlow {
  day: number;
  date: string;
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  data: DailyFlow[];
  month: number;
  year: number;
}

export function DailyFlowChart({ data, month, year }: Props) {
  const monthName = new Date(year, month - 1).toLocaleString("pt-BR", {
    month: "long",
  });
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Filter to show only days with income > 0 or expense > 0
  const activeDays = data.filter((d) => d.income > 0 || d.expense > 0);

  const chartData = activeDays.map((d) => ({
    ...d,
    dayLabel: `${d.day} ${capitalizedMonth.substring(0, 3).toLowerCase()}`,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const balance = data.income - data.expense;
      const fullDate = new Date(data.date).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium text-sm">{fullDate}</p>
          <p className="text-green-600 text-sm">
            Entradas: {formatCurrency(data.income)}
          </p>
          <p className="text-red-600 text-sm">
            Saídas: {formatCurrency(data.expense)}
          </p>
          <p
            className={`text-sm font-medium ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            Saldo do dia: {formatCurrency(balance)}
          </p>
        </div>
      );
    }
    return null;
  };

  const isMobile = useIsMobile();
  const barSize = Math.max(
    20,
    Math.floor(300 / Math.max(1, activeDays.length)),
  );
  const shouldRotateLabels = activeDays.length > 15;

  if (activeDays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações do Período</CardTitle>
          <p className="text-sm text-muted-foreground">
            Apenas dias com entradas ou saídas confirmadas
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma movimentação confirmada neste período ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movimentações do Período</CardTitle>
        <p className="text-sm text-muted-foreground">
          Apenas dias com entradas ou saídas confirmadas
        </p>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: shouldRotateLabels ? 60 : 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dayLabel"
                tick={{
                  fontSize: isMobile ? 10 : 12,
                  angle: shouldRotateLabels ? -45 : 0,
                  textAnchor: shouldRotateLabels ? "end" : "middle",
                  height: shouldRotateLabels ? 80 : 40,
                }}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="income"
                fill="#16a34a"
                name="Entradas"
                barSize={barSize}
              />
              <Bar
                dataKey="expense"
                fill="#dc2626"
                name="Saídas"
                barSize={barSize}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
