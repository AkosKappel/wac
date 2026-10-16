import { nextService } from './service';

describe('nextService', () => {
  const now = new Date('2026-10-16T00:00:00Z');

  it('is undefined without a service plan', () => {
    expect(nextService({ lastServiceAt: '2026-01-01T00:00:00Z' }, now)).toBeUndefined();
  });

  it('is overdue when the device was never serviced', () => {
    expect(nextService({ serviceIntervalDays: 365 }, now)).toEqual({ status: 'overdue' });
  });

  it('adds the interval to the last service', () => {
    expect(nextService({ serviceIntervalDays: 100, lastServiceAt: '2026-10-01T00:00:00Z' }, now)).toEqual({
      date: '2027-01-09T00:00:00.000Z',
      status: 'ok',
    });
  });

  it('is due within 30 days and overdue after the date', () => {
    expect(nextService({ serviceIntervalDays: 30, lastServiceAt: '2026-10-01T00:00:00Z' }, now).status).toBe('due');
    expect(nextService({ serviceIntervalDays: 10, lastServiceAt: '2026-10-01T00:00:00Z' }, now).status).toBe('overdue');
  });
});
