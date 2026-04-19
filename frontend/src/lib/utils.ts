import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function parseDateOnly(dateString: string): Date {
  const str = dateString.split('T')[0];
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDateOnly(dateString);
  return date.toLocaleDateString('pt-BR', options ?? { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function dateToUTC(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}
