import { Component, Host, Prop, State, h } from '@stencil/core';
import { AmbulanceDeviceListApiFactory } from '../../api/ambulance-wl';
import { formatPrice, t } from '../../utils/i18n';
import { Overview, overview } from '../../utils/overview';
import { hrefTo } from '../../utils/utils';

@Component({
  tag: 'harkap-ambulance-home',
  styleUrls: ['harkap-ambulance-home.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceHome {
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() overview: Overview;
  @State() loadFailed = false;

  // not awaited, so the page renders right away with placeholders
  componentWillLoad() {
    this.loadOverview();
  }

  private async loadOverview() {
    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).getDeviceListEntries();
      this.overview = overview(response.data ?? []);
    } catch {
      this.loadFailed = true;
    }
  }

  render() {
    const m = t().home;
    const href = (path: string) => hrefTo(this.basePath, path);
    const stat = (icon: string, label: string, value?: string | number, link?: string, tone = '') => {
      const content = [
        <md-icon>{icon}</md-icon>,
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
    const o = this.overview;
    const maxValue = o?.departments[0]?.value || 1;
    const quickLinks = [
      ['inventory_2', href('./devices'), m.links.devices],
      ['add_circle', href('./devices/@new'), m.links.newDevice],
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
                <md-icon>cloud_off</md-icon>
                {m.loadFailed}
              </p>
            ) : (
              [
                <div class="stats">
                  {stat('medical_services', m.deviceCount, o?.count, './devices')}
                  {stat('euro', m.totalValue, o && formatPrice(o.totalValue))}
                  {stat('schedule', m.expiringSoon, o?.expiring, './devices?warranty=expiring', 'expiring')}
                  {stat('error', m.expired, o?.expired, './devices?warranty=expired', 'expired')}
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
                              <span style={{ width: `${(department.value / maxValue) * 100}%` }}></span>
                            </span>
                            <span class="department-value">{formatPrice(department.value)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
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
                  <md-icon>{icon}</md-icon>
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
