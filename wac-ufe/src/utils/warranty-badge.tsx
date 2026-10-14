import { FunctionalComponent, h } from '@stencil/core';
import { formatDate, t } from './i18n';
import { warrantyStatus } from './utils';

export const WarrantyBadge: FunctionalComponent<{ until: string }> = ({ until }) => {
  const status = warrantyStatus(until);
  const m = t().warranty;
  const label = status === 'expired' ? m.expired : m[status](formatDate(until));
  return <span class={`badge ${status}`}>{label}</span>;
};
