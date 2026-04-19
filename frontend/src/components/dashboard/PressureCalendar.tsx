import { useState } from 'react';
import { formatCurrency, formatDateOnly } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface CalendarDay {
  day: number;
  date: string;
  dailyIncome: number;
  dailyExpense: number;
  cumulativeBalance: number;
  pressure: 'LOW' | 'MEDIUM' | 'HIGH' | 'POSITIVE';
  items: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    status: string;
    memberName: string;
    categoryName: string;
  }>;
}

interface Props {
  data: CalendarDay[];
  month: number;
  year: number;
}

export function PressureCalendar({ data, month, year }: Props) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 = Sunday

  const getPressureColor = (pressure: string) => {
    switch (pressure) {
      case 'POSITIVE': return 'bg-green-100 hover:bg-green-200';
      case 'LOW': return 'bg-yellow-100 hover:bg-yellow-200';
      case 'MEDIUM': return 'bg-orange-100 hover:bg-orange-200';
      case 'HIGH': return 'bg-red-100 hover:bg-red-200';
      default: return 'bg-gray-100 hover:bg-gray-200';
    }
  };

  const getPressureLabel = (pressure: string) => {
    switch (pressure) {
      case 'POSITIVE': return 'Saldo positivo';
      case 'LOW': return 'Pressão baixa';
      case 'MEDIUM': return 'Pressão média';
      case 'HIGH': return 'Pressão alta';
      default: return '';
    }
  };

  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = data.find(d => d.day === day);
    calendarDays.push(dayData || null);
  }

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pressão Financeira — {capitalizedMonth} {year}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cores indicam o saldo acumulado dia a dia considerando entradas e saídas previstas e realizadas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Header */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Days */}
            {weeks.map((week, weekIndex) =>
              week.map((dayData, dayIndex) => (
                <Popover key={`${weekIndex}-${dayIndex}`}>
                  <PopoverTrigger asChild>
                    <div
                      className={`p-2 min-h-[60px] border rounded cursor-pointer transition-colors ${
                        dayData ? getPressureColor(dayData.pressure) : 'bg-gray-50'
                      }`}
                      onClick={() => dayData && setSelectedDay(dayData)}
                    >
                      {dayData ? (
                        <>
                          <div className="text-sm font-medium">{dayData.day}</div>
                          {dayData.items.length > 0 && (
                            <div className="text-xs mt-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
                            </div>
                          )}
                          <div className="text-xs mt-1 text-muted-foreground">
                            {dayData.cumulativeBalance !== 0 && formatCurrency(dayData.cumulativeBalance)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">-</div>
                      )}
                    </div>
                  </PopoverTrigger>
                  {dayData && (
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <div className="font-medium">{formatDateOnly(dayData.date)}</div>
                        <div className="text-sm">
                          <div>Saldo acumulado: <span className="font-medium">{formatCurrency(dayData.cumulativeBalance)}</span></div>
                          <div>Entradas do dia: <span className="text-green-600">{formatCurrency(dayData.dailyIncome)}</span></div>
                          <div>Saídas do dia: <span className="text-red-600">{formatCurrency(dayData.dailyExpense)}</span></div>
                        </div>
                        {dayData.items.length > 0 ? (
                          <div>
                            <div className="font-medium mb-2">Movimentações:</div>
                            <div className="space-y-2">
                              {dayData.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <div>
                                    <div className="font-medium">{item.description}</div>
                                    <div className="text-muted-foreground">{item.memberName} • {item.categoryName}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                                      {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {item.status === 'PENDING' ? 'Previsto' : 'Realizado'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Nenhuma movimentação neste dia</div>
                        )}
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              ))
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border rounded"></div>
              <span>Saldo positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
              <span>Pressão baixa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border rounded"></div>
              <span>Pressão média</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border rounded"></div>
              <span>Pressão alta</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}