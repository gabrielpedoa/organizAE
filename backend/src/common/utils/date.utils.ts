export function toMidnightUTC(date: Date | string): Date {
  const str = typeof date === 'string' ? date : date.toISOString();
  return new Date(str.split('T')[0] + 'T00:00:00.000Z');
}
