import { DeviceListEntry, LogType } from '../api/ambulance-wl';

export const LOG_TYPES: LogType[] = ['purchase', 'installation', 'service', 'calibration', 'repair', 'other'];

export const LOG_TYPE_ICONS: Record<LogType, string> = {
  purchase: 'shopping_cart',
  installation: 'construction',
  service: 'engineering',
  calibration: 'tune',
  repair: 'build',
  other: 'description',
};

export type ServiceStatus = 'ok' | 'due' | 'overdue';

/** Days ahead that count as due, like the maintenance page's default. */
export const DUE_DAYS = 30;

export interface NextService {
  /** ISO date of the next service; missing when the device was never serviced */
  date?: string;
  status: ServiceStatus;
}

/** The next service from the last one and the interval; undefined without a service plan. */
export function nextService(
  device: Pick<DeviceListEntry, 'serviceIntervalDays' | 'lastServiceAt'>,
  now = new Date(),
): NextService | undefined {
  if (!device.serviceIntervalDays) return undefined;
  if (!device.lastServiceAt) return { status: 'overdue' };
  const next = new Date(new Date(device.lastServiceAt).getTime() + device.serviceIntervalDays * 86_400_000);
  const daysLeft = (next.getTime() - now.getTime()) / 86_400_000;
  return { date: next.toISOString(), status: daysLeft < 0 ? 'overdue' : daysLeft <= DUE_DAYS ? 'due' : 'ok' };
}
