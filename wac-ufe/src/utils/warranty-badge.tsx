import { FunctionalComponent, h } from '@stencil/core';
import { warrantyStatus } from './utils';

export const WarrantyBadge: FunctionalComponent<{ until: string }> = ({ until }) => {
  const status = warrantyStatus(until);
  const date = new Date(until).toLocaleDateString('sk-SK');
  const label = { ok: `V záruke do ${date}`, expiring: `Záruka končí ${date}`, expired: 'Záruka vypršala' }[status];
  return <span class={`badge ${status}`}>{label}</span>;
};
