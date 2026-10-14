import { overview } from './overview';

describe('overview', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  const device = (id: string, code: string, price: number, warrantyUntil: string) => ({
    id,
    name: id,
    deviceId: id,
    price,
    warrantyUntil,
    department: { code, name: code.toUpperCase() },
  });

  it('counts devices, value and warranty states', () => {
    const result = overview(
      [
        device('a', 'rad', 1000, '2030-01-01T00:00:00Z'),
        device('b', 'rad', 500, '2026-11-01T00:00:00Z'),
        device('c', 'lab', 2000, '2026-01-01T00:00:00Z'),
      ],
      now,
    );
    expect(result).toMatchObject({ count: 3, totalValue: 3500, expiring: 1, expired: 1 });
    expect(result.departments).toEqual([
      { code: 'lab', name: 'LAB', value: 2000, count: 1 },
      { code: 'rad', name: 'RAD', value: 1500, count: 2 },
    ]);
  });

  it('handles an empty list', () => {
    expect(overview([], now)).toEqual({ count: 0, totalValue: 0, expiring: 0, expired: 0, departments: [] });
  });
});
