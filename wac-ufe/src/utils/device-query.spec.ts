import { applyQuery, parseQuery, toSearch } from './device-query';

describe('device query', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  const devices = [
    { id: 'a', name: 'Röntgen', deviceId: 'a', price: 150000, warrantyUntil: '2030-01-01T00:00:00Z', department: { code: 'ort', name: 'Ortopedické' } },
    { id: 'b', name: 'Defibrilátor', deviceId: 'b', price: 12800, warrantyUntil: '2026-11-01T00:00:00Z', department: { code: 'chir', name: 'Chirurgia' } },
    { id: 'c', name: 'Centrifúga', deviceId: 'c', price: 6800, warrantyUntil: '2026-01-01T00:00:00Z', department: { code: 'lab', name: 'Laboratórium' } },
  ];
  const ids = (query: string) => applyQuery([...devices], parseQuery(query), 'sk-SK', now).map(d => d.id);

  it('sorts by name by default', () => {
    expect(ids('')).toEqual(['c', 'b', 'a']);
  });

  it('sorts by warranty end and by price', () => {
    expect(ids('?sort=warranty')).toEqual(['c', 'b', 'a']);
    expect(ids('?sort=price')).toEqual(['a', 'b', 'c']);
  });

  it('searches names and departments without accents', () => {
    expect(ids('?q=rontgen')).toEqual(['a']);
    expect(ids('?q=dfb')).toEqual(['b']);
    expect(ids('?q=labor')).toEqual(['c']);
    expect(ids('?q=(')).toEqual([]);
  });

  it('filters by department and warranty state', () => {
    expect(ids('?department=chir')).toEqual(['b']);
    expect(ids('?warranty=expiring')).toEqual(['b']);
    expect(ids('?warranty=expired')).toEqual(['c']);
  });

  it('ignores unknown values and leaves defaults out of the URL', () => {
    expect(parseQuery('?sort=evil&warranty=nope')).toEqual({ q: '', department: '', warranty: '', sort: 'name' });
    expect(toSearch(parseQuery('?sort=name'))).toEqual('');
    expect(toSearch({ q: 'ct scan', department: 'rad', warranty: 'expired', sort: 'price' })).toEqual(
      '?q=ct+scan&department=rad&warranty=expired&sort=price',
    );
  });
});
