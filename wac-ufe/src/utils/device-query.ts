import { DeviceListEntry } from '../api/ambulance-wl';
import { WarrantyStatus, warrantyStatus } from './utils';

export type SortKey = 'name' | 'warranty' | 'price';

/** List filters, kept in the URL query so a filtered list can be shared. */
export interface DeviceQuery {
  q: string;
  department: string;
  warranty: WarrantyStatus | '';
  sort: SortKey;
}

const SORT_KEYS: SortKey[] = ['name', 'warranty', 'price'];
const WARRANTY_STATES: WarrantyStatus[] = ['ok', 'expiring', 'expired'];

export function parseQuery(search: string): DeviceQuery {
  const params = new URLSearchParams(search);
  const warranty = params.get('warranty') as WarrantyStatus;
  const sort = params.get('sort') as SortKey;
  return {
    q: params.get('q') ?? '',
    department: params.get('department') ?? '',
    warranty: WARRANTY_STATES.includes(warranty) ? warranty : '',
    sort: SORT_KEYS.includes(sort) ? sort : 'name',
  };
}

/** The query string for the URL; default values are left out. */
export function toSearch(query: DeviceQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.department) params.set('department', query.department);
  if (query.warranty) params.set('warranty', query.warranty);
  if (query.sort !== 'name') params.set('sort', query.sort);
  const search = params.toString();
  return search ? `?${search}` : '';
}

export function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents, so "rontgen" finds "Röntgen"
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyQuery(
  devices: DeviceListEntry[],
  query: DeviceQuery,
  locale: string,
  now = new Date(),
): DeviceListEntry[] {
  // the letters in order with anything between them: "defib" and "dfb" both find "Defibrilátor"
  const search = new RegExp(normalize(query.q).split('').map(escapeRegExp).join('.*?'), 'i');
  const filtered = devices.filter(
    device =>
      (search.test(normalize(device.name)) || search.test(normalize(device.department?.name))) &&
      (!query.department || device.department?.code === query.department) &&
      (!query.warranty || warrantyStatus(device.warrantyUntil, now) === query.warranty),
  );
  const compare: Record<SortKey, (a: DeviceListEntry, b: DeviceListEntry) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, locale),
    warranty: (a, b) => new Date(a.warrantyUntil).getTime() - new Date(b.warrantyUntil).getTime(),
    price: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  };
  return filtered.sort(compare[query.sort]);
}
