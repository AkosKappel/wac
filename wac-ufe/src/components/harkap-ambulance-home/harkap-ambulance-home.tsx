import { Component, Host, Prop, State, h } from '@stencil/core';
import { Stats } from '../../api/ambulance-wl';
import { apiClients } from '../../utils/api';
import { formatPrice, t } from '../../utils/i18n';
import { lastTwelveMonths } from '../../utils/overview';
import { DUE_DAYS } from '../../utils/service';
import { hrefTo } from '../../utils/utils';

@Component({
  tag: 'harkap-ambulance-home',
  styleUrls: ['harkap-ambulance-home.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceHome {
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() stats: Stats;
  @State() dueCount: number;
  @State() loadFailed = false;

  // not awaited, so the page renders right away with placeholders
  componentWillLoad() {
    this.loadOverview();
  }

  private async loadOverview() {
    const api = apiClients(this.apiBase);
    try {
      const [stats, due] = await Promise.all([
        api.stats.getStats(),
        api.maintenance.getMaintenanceDue({ days: DUE_DAYS }),
      ]);
      this.stats = stats;
      this.dueCount = due.length;
    } catch {
      this.loadFailed = true;
    }
  }

  render() {
    const m = t().home;
    const href = (path: string) => hrefTo(this.basePath, path);
    const stat = (icon: string, label: string, value?: string | number, link?: string, tone = '') => {
      const content = [
        <md-icon aria-hidden="true">{icon}</md-icon>,
        <span class="stat-value">{value ?? <span class="skeleton"></span>}</span>,
        <span class="stat-label">{label}</span>,
      ];
      return link ? (
        <a class={`stat ${tone}`} href={href(link)}>
          {content}
        </a>
      ) : (
        <div class={`stat ${tone}`}>{content}</div>
      );
    };
    const o = this.stats;
    const maxValue = o?.departments[0]?.totalValue || 1;
    const months = o && lastTwelveMonths(o.logsPerMonth);
    const maxMonth = Math.max(1, ...(months ?? []).map(month => month.count));
    const monthName = (month: string) =>
      new Date(`${month}-01T00:00:00Z`).toLocaleDateString(t().locale, { month: 'short', timeZone: 'UTC' });
    const quickLinks = [
      ['inventory_2', href('./devices'), m.links.devices],
      ['add_circle', href('./devices/@new'), m.links.newDevice],
      ['engineering', href('./maintenance'), m.links.maintenance],
      ['apartment', href('./departments'), m.links.departments],
      ['info', href('./about'), m.links.about],
      ['api', '/api-docs/', m.links.apiDocs],
    ] as const;

    return (
      <Host>
        <div class="container">
          <section class="hero">
            <p class="eyebrow">{m.eyebrow}</p>
            <h1>{m.title}</h1>
            <p class="intro">{m.intro}</p>
            <div class="hero-actions">
              <md-filled-button href={href('./devices')}>
                <md-icon slot="icon">inventory_2</md-icon>
                {m.browse}
              </md-filled-button>
              <md-outlined-button href={href('./devices/@new')}>
                <md-icon slot="icon">add</md-icon>
                {m.newDevice}
              </md-outlined-button>
            </div>
          </section>

          <section aria-labelledby="overview-title">
            <h2 id="overview-title">{m.overview}</h2>
            {this.loadFailed ? (
              <p class="load-failed" role="alert">
                <md-icon aria-hidden="true">cloud_off</md-icon>
                {m.loadFailed}
              </p>
            ) : (
              [
                <div class="stats">
                  {stat('medical_services', m.deviceCount, o?.deviceCount, './devices')}
                  {stat('euro', m.totalValue, o && formatPrice(o.totalValue))}
                  {stat('schedule', m.expiringSoon, o?.warranty.expiring, './devices?warranty=expiring', 'expiring')}
                  {stat('error', m.expired, o?.warranty.expired, './devices?warranty=expired', 'expired')}
                  {stat('engineering', m.dueForService, this.dueCount, './maintenance', 'expiring')}
                </div>,
                <div class="card departments">
                  <h3>{m.valueByDepartment}</h3>
                  {!o ? (
                    <span class="skeleton bars-skeleton"></span>
                  ) : (
                    <ul>
                      {o.departments.map(department => (
                        <li>
                          <a href={href(`./devices?department=${encodeURIComponent(department.code)}`)}>
                            <span class="department-name">
                              {department.name}
                              <small>{m.devicesIn(department.count)}</small>
                            </span>
                            <span class="bar" aria-hidden="true">
                              <span style={{ width: `${(department.totalValue / maxValue) * 100}%` }}></span>
                            </span>
                            <span class="department-value">{formatPrice(department.totalValue)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>,
                <div class="card months">
                  <h3>{m.logsPerMonth}</h3>
                  {!months ? (
                    <span class="skeleton bars-skeleton"></span>
                  ) : (
                    <ol class="month-bars">
                      {months.map(month => (
                        <li title={`${monthName(month.month)}: ${m.entries(month.count)}`}>
                          <span class="month-count">{month.count || ''}</span>
                          {/* the labels above and below take about 36px of the column */}
                          <span
                            class="month-bar"
                            style={{ height: `calc((100% - 36px) * ${month.count / maxMonth})` }}
                          ></span>
                          <span class="month-name">{monthName(month.month)}</span>
                          <span class="visually-hidden">{m.entries(month.count)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>,
              ]
            )}
          </section>

          <section aria-labelledby="explore-title">
            <h2 id="explore-title">{m.explore}</h2>
            <div class="quick-links">
              {quickLinks.map(([icon, link, [title, text]]) => (
                <a class="quick-link" href={link}>
                  <md-icon aria-hidden="true">{icon}</md-icon>
                  <span>
                    <strong>{title}</strong>
                    <span>{text}</span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </Host>
    );
  }
}
