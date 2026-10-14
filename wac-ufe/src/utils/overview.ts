import { DeviceListEntry } from '../api/ambulance-wl';
import { warrantyStatus } from './utils';

export interface DepartmentValue {
  code: string;
  name: string;
  value: number;
  count: number;
}

export interface Overview {
  count: number;
  totalValue: number;
  expiring: number;
  expired: number;
  /** highest value first */
  departments: DepartmentValue[];
}

/** Totals for the homepage; computed in the browser, which is plenty for a few hundred devices. */
export function overview(devices: DeviceListEntry[], now = new Date()): Overview {
  const departments = new Map<string, DepartmentValue>();
  const result: Overview = { count: devices.length, totalValue: 0, expiring: 0, expired: 0, departments: [] };
  for (const device of devices) {
    const price = device.price ?? 0;
    result.totalValue += price;
    const status = warrantyStatus(device.warrantyUntil, now);
    if (status === 'expiring') result.expiring++;
    if (status === 'expired') result.expired++;

    const { code = '', name = '' } = device.department ?? {};
    const department = departments.get(code || name) ?? { code, name, value: 0, count: 0 };
    department.value += price;
    department.count++;
    departments.set(code || name, department);
  }
  result.departments = [...departments.values()].sort((a, b) => b.value - a.value);
  return result;
}
