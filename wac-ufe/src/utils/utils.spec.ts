import { format, warrantyStatus } from './utils';

describe('format', () => {
  it('returns empty string for no names defined', () => {
    expect(format(undefined, undefined, undefined)).toEqual('');
  });

  it('formats just first names', () => {
    expect(format('Joseph', undefined, undefined)).toEqual('Joseph');
  });

  it('formats first and last names', () => {
    expect(format('Joseph', undefined, 'Publique')).toEqual('Joseph Publique');
  });

  it('formats first, middle and last names', () => {
    expect(format('Joseph', 'Quincy', 'Publique')).toEqual('Joseph Quincy Publique');
  });
});

describe('warrantyStatus', () => {
  const now = new Date('2026-10-14T12:00:00Z');

  it('is expired after the warranty date', () => {
    expect(warrantyStatus('2026-10-13T00:00:00Z', now)).toEqual('expired');
  });

  it('is expiring within 90 days', () => {
    expect(warrantyStatus('2026-10-15T00:00:00Z', now)).toEqual('expiring');
    expect(warrantyStatus('2027-01-11T00:00:00Z', now)).toEqual('expiring');
  });

  it('is ok later than 90 days', () => {
    expect(warrantyStatus('2027-01-13T00:00:00Z', now)).toEqual('ok');
  });
});
