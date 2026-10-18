import { addDays, dayKey, monthWeeks, weekdayIndex } from './calendar';
import { toIcs } from './ics';

describe('calendar', () => {
  it('lays out a month in whole weeks from Monday', () => {
    // October 2026 starts on a Thursday and ends on a Saturday
    const weeks = monthWeeks(new Date(2026, 9, 18));
    expect(weeks).toHaveLength(5);
    expect(dayKey(weeks[0][0])).toBe('2026-09-28');
    expect(dayKey(weeks[4][6])).toBe('2026-11-01');
    expect(weeks.every(week => week.length === 7 && weekdayIndex(week[0]) === 0)).toBe(true);
  });

  it('adds days across months', () => {
    expect(dayKey(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01');
    expect(dayKey(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
  });
});

describe('toIcs', () => {
  it('writes all-day events with escaped text and folded lines', () => {
    const ics = toIcs(
      [
        {
          uid: 'ct-01-2026-10-18@ambulance',
          date: '2026-10-18',
          summary: 'Servis: CT, Röntgen; 1',
          url: 'https://x.test/a',
        },
      ],
      new Date('2026-10-18T08:30:15.123Z'),
    );
    expect(ics).toContain('DTSTAMP:20261018T083015Z\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261018\r\n');
    expect(ics).toContain('SUMMARY:Servis: CT\\, Röntgen\\; 1\r\n');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);

    const long = toIcs([{ uid: 'a', date: '2026-01-01', summary: 'č'.repeat(60) }]);
    const lines = long.split('\r\n');
    expect(lines.every(line => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(long.replace(/\r\n /g, '')).toContain(`SUMMARY:${'č'.repeat(60)}`);
  });
});
