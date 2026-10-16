import { lastTwelveMonths } from './overview';

describe('lastTwelveMonths', () => {
  const now = new Date('2026-10-14T12:00:00Z');

  it('fills months without entries with 0, oldest first', () => {
    const months = lastTwelveMonths(
      [
        { month: '2025-11', count: 3 },
        { month: '2026-10', count: 5 },
      ],
      now,
    );
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: '2025-11', count: 3 });
    expect(months[1]).toEqual({ month: '2025-12', count: 0 });
    expect(months[11]).toEqual({ month: '2026-10', count: 5 });
  });

  it('ignores months outside the window', () => {
    expect(lastTwelveMonths([{ month: '2024-01', count: 9 }], now).every(m => m.count === 0)).toBe(true);
  });
});
