import { FunctionalComponent, h } from '@stencil/core';
import { formatDate, t } from './i18n';
import { DeviceListEntry } from '../api/ambulance-wl';
import { nextService } from './service';
import { warrantyStatus } from './utils';

export const WarrantyBadge: FunctionalComponent<{ until: string }> = ({ until }) => {
  const status = warrantyStatus(until);
  const m = t().warranty;
  const label = status === 'expired' ? m.expired : m[status](formatDate(until));
  return <span class={`badge ${status}`}>{label}</span>;
};

/** Service state for devices with a plan; nothing while the next service is far away. */
export const ServiceBadge: FunctionalComponent<{
  device: Pick<DeviceListEntry, 'serviceIntervalDays' | 'lastServiceAt'>;
}> = ({ device }) => {
  const next = nextService(device);
  if (!next || next.status === 'ok') return null;
  const m = t().service;
  return (
    <span class={`badge ${next.status === 'due' ? 'expiring' : 'expired'}`}>
      {next.status === 'due' ? m.due(formatDate(next.date)) : m.overdue}
    </span>
  );
};
