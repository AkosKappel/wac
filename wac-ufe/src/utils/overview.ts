import { MonthCount } from '../api/ambulance-wl';

/** The twelve months up to now as "YYYY-MM", oldest first, with 0 for months without entries. */
export function lastTwelveMonths(counts: MonthCount[], now = new Date()): MonthCount[] {
  const byMonth = new Map(counts.map(c => [c.month, c.count]));
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const month = date.toISOString().slice(0, 7);
    return { month, count: byMonth.get(month) ?? 0 };
  });
}
