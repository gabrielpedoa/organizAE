import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CommittedItem {
  description: string;
  amount: number;
  type: string;
  status: string;
  memberName: string;
}

interface BestDate {
  date: string;
  day: number;
  month: number;
  year: number;
  cumulativeBalance: number;
  dailyIncome: number;
  dailyExpense: number;
  rank: 'ÓTIMO' | 'BOM' | 'OK' | 'RUIM';
  committedItems: CommittedItem[];
}

interface Props {
  data: BestDate[];
}

const rankColors: Record<BestDate['rank'], string> = {
  ÓTIMO: '#16a34a',
  BOM: '#86efac',
  OK: '#fbbf24',
  RUIM: '#ef4444',
};

const rankTextColor: Record<BestDate['rank'], string> = {
  ÓTIMO: 'text-green-700',
  BOM: 'text-green-700',
  OK: 'text-amber-700',
  RUIM: 'text-red-700',
};

export function BestDatesPanel({ data }: Props) {
  const chartData = data.map((item) => ({
    ...item,
    label: `${String(item.day).padStart(2, '0')}/${String(item.month).padStart(2, '0')}`,
    color: rankColors[item.rank],
  }));

  const secondMonthStart = chartData.find((item, index) => {
    if (index === 0) return false;
    const prev = chartData[index - 1];
    return item.month !== prev.month || item.year !== prev.year;
  });

  const separatorX = secondMonthStart?.label;

  const topDays = chartData
    .filter((item) => item.rank === 'ÓTIMO' || item.rank === 'BOM')
    .sort((a, b) => b.cumulativeBalance - a.cumulativeBalance)
    .slice(0, 8);

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload as BestDate & { label: string };

    return (
      <div className="bg-white p-3 border rounded shadow">
        <div className="font-medium mb-2">{formatDateOnly(data.date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        <div className="text-sm text-muted-foreground mb-2">Saldo disponível: <span className="font-medium">{formatCurrency(data.cumulativeBalance)}</span></div>
        <div className="text-sm mb-2">Classificação: <span className="font-medium">{data.rank}</span></div>
        <div className="text-sm font-medium mb-1">Compromissos do dia</div>
        {data.committedItems.length > 0 ? (
          <div className="space-y-1">
            {data.committedItems.map((item) => (
              <div key={`${item.description}-${item.amount}`} className="text-sm">
                {item.description} • {formatCurrency(item.amount)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Nenhum compromisso</div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Melhores datas para novos compromissos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseado no saldo acumulado considerando entradas e saídas previstas e realizadas dos próximos dois meses
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                {separatorX && <ReferenceLine x={separatorX} stroke="#9ca3af" strokeDasharray="3 3" />}
                <Bar dataKey="cumulativeBalance" name="Saldo acumulado">
                  {chartData.map((entry) => (
                    <Cell key={entry.date} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-700"></span>
                <span>Ótimo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-300"></span>
                <span>Bom</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400"></span>
                <span>Ok</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span>Ruim</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 font-medium">Melhores dias para assumir novos compromissos</div>
            {topDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum dia com folga financeira identificado neste período.</p>
            ) : (
              <div className="space-y-3">
                {topDays.map((item) => (
                  <div key={item.date} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-4">
                      <Badge className={`rounded-full px-2 ${rankTextColor[item.rank]}`}>
                        {item.rank}
                      </Badge>
                      <div className="text-sm font-medium">{formatShortDate(item.date)}</div>
                      <div className="text-sm font-semibold">{formatCurrency(item.cumulativeBalance)}</div>
                    </div>
                    {item.committedItems.length > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.committedItems.map((commit) => `${commit.description} ${formatCurrency(commit.amount)}`).join(' • ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
