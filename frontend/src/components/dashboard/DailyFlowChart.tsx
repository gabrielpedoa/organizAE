import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateOnly } from '@/lib/utils';

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
  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Calculate cumulative balance
  let cumulative = 0;
  const chartData = data.map(d => {
    cumulative += d.balance;
    return {
      ...d,
      cumulativeBalance: cumulative,
      expenseNegative: -d.expense, // for negative bars
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{formatDateOnly(data.date)}</p>
          <p className="text-green-600">Entradas: {formatCurrency(data.income)}</p>
          <p className="text-red-600">Saídas: {formatCurrency(data.expense)}</p>
          <p className="text-blue-600">Saldo do dia: {formatCurrency(data.balance)}</p>
          <p className="text-purple-600">Saldo acumulado: {formatCurrency(data.cumulativeBalance)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fluxo Diário — {capitalizedMonth} {year}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Entradas" />
            <Bar dataKey="expenseNegative" fill="#ef4444" name="Saídas" />
            <Line type="monotone" dataKey="cumulativeBalance" stroke="#3b82f6" strokeWidth={2} name="Saldo acumulado" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}