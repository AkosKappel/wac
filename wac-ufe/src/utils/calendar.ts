/** The local date as YYYY-MM-DD, to group dates by calendar day. */
export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Days since Monday: 0 for Monday, 6 for Sunday. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** The weeks of the month that contains the date, Monday first, padded with days of the months around it. */
export function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  let day = addDays(first, -weekdayIndex(first));
  const weeks: Date[][] = [];
  do {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
    day = addDays(day, 7);
  } while (day.getMonth() === first.getMonth());
  return weeks;
}
