import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MonthNavigatorProps {
  month: number;
  year: number;
  onNavigate: (direction: -1 | 1) => void;
  disabled?: boolean;
}

export function MonthNavigator({ month, year, onNavigate, disabled }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Mês anterior"
        disabled={disabled}
        onClick={() => onNavigate(-1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium w-36 text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label="Próximo mês"
        disabled={disabled}
        onClick={() => onNavigate(1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
