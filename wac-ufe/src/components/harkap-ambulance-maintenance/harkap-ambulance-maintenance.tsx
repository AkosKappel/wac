import { Component, Host, Prop, State, h } from '@stencil/core';
import { MaintenanceItem } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { formatDate, t } from '../../utils/i18n';
import { hrefTo } from '../../utils/utils';

const PERIODS = [30, 90, 365];

/** Days from today to the given date, counted in whole calendar days. */
function daysUntil(iso: string, now = new Date()): number {
  const day = (date: Date) => new Date(date).setHours(0, 0, 0, 0);
  return Math.round((day(new Date(iso)) - day(now)) / 86_400_000);
}

@Component({
  tag: 'harkap-ambulance-maintenance',
  styleUrls: ['harkap-ambulance-maintenance.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceMaintenance {
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() days = PERIODS[0];
  @State() items: MaintenanceItem[];
  @State() errorMessage: string;
  @State() errorStatus: number;

  componentWillLoad() {
    this.load();
  }

  private async load() {
    this.items = undefined;
    try {
      this.items = await apiClients(this.apiBase).maintenance.getMaintenanceDue({ days: this.days });
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().maintenance.loadFailed}: ${message}`;
    }
  }

  render() {
    const m = t().maintenance;
    if (this.errorMessage) {
      return (
        <Host>
          <ErrorPage status={this.errorStatus} message={this.errorMessage} />
        </Host>
      );
    }
    return (
      <Host>
        <div class="container">
          <header>
            <p class="eyebrow">{m.eyebrow}</p>
            <h1>{m.title}</h1>
            <p class="intro">{m.intro}</p>
          </header>

          <md-outlined-select
            class="period"
            label={m.within}
            value={String(this.days)}
            onChange={(ev: Event) => {
              this.days = Number((ev.target as HTMLSelectElement).value);
              this.load();
            }}
          >
            {PERIODS.map(days => (
              <md-select-option value={String(days)}>
                <div slot="headline">{m.days(days)}</div>
              </md-select-option>
            ))}
          </md-outlined-select>

          {!this.items ? (
            <div class="card">
              <SkeletonRows count={3} />
            </div>
          ) : this.items.length === 0 ? (
            <p class="empty">
              <md-icon aria-hidden="true">task_alt</md-icon>
              {m.empty}
            </p>
          ) : (
            <ul class="items">
              {this.items.map(item => (
                <li class={{ item: true, overdue: item.overdue }}>
                  <a href={hrefTo(this.basePath, './devices/' + encodeURIComponent(item.id))}>
                    <md-icon aria-hidden="true">engineering</md-icon>
                    <span class="main">
                      <strong>{item.name}</strong>
                      <span class="sub">
                        {[item.deviceId, item.department?.name, m.interval(item.serviceIntervalDays)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      <span class="sub">
                        {m.lastService}: {item.lastServiceAt ? formatDate(item.lastServiceAt) : m.never}
                        {item.lastServiceAt && ` · ${m.nextService}: ${formatDate(item.nextServiceAt)}`}
                      </span>
                    </span>
                    <span class={`badge ${item.overdue ? 'expired' : 'expiring'}`}>
                      {item.overdue ? m.overdue : m.dueIn(daysUntil(item.nextServiceAt))}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Host>
    );
  }
}
