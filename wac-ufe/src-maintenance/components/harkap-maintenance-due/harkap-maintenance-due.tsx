import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { AmbulanceMaintenanceApi, Configuration, MaintenanceItem } from '../../../src/api/ambulance-wl';

const messages = {
  sk: {
    locale: 'sk-SK',
    eyebrow: 'Servisný plán',
    title: 'Zariadenia na servis',
    intro:
      'Zariadenia so servisným intervalom, ktorým sa blíži alebo už uplynul termín servisu. Záznam typu Servis v prevádzkovom logu posunie ďalší termín.',
    within: 'Termín do',
    days: (days: number) => (days === 365 ? '1 roka' : `${days} dní`),
    overdue: 'Po termíne',
    never: 'Zatiaľ bez servisu',
    dueIn: (days: number) => (days === 0 ? 'Dnes' : days === 1 ? 'Zajtra' : `O ${days} dní`),
    lastService: 'Posledný servis',
    nextService: 'Ďalší servis',
    interval: (days: number) => `každých ${days} dní`,
    empty: 'V tomto období nemá servis žiadne zariadenie.',
    loadFailed: 'Servisný plán sa nepodarilo načítať.',
    retry: 'Skúsiť znova',
    loading: 'Načítava sa',
  },
  en: {
    locale: 'en-GB',
    eyebrow: 'Service plan',
    title: 'Devices due for service',
    intro:
      'Devices with a service interval whose service is due soon or overdue. A log entry of type Service moves the next date.',
    within: 'Due within',
    days: (days: number) => (days === 365 ? '1 year' : `${days} days`),
    overdue: 'Overdue',
    never: 'Never serviced',
    dueIn: (days: number) => (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`),
    lastService: 'Last service',
    nextService: 'Next service',
    interval: (days: number) => `every ${days} days`,
    empty: 'No device is due for service in this period.',
    loadFailed: 'Could not load the service plan.',
    retry: 'Try again',
    loading: 'Loading',
  },
};

const PERIODS = [30, 90, 365];

@Component({
  tag: 'harkap-maintenance-due',
  styleUrl: 'harkap-maintenance-due.css',
  shadow: true,
})
export class HarkapMaintenanceDue {
  @Prop() apiBase: string;
  @Prop() basePath: string = '/';
  /** "sk" or "en"; the shell passes its current language */
  @Prop() language: string = 'en';
  @State() days = PERIODS[0];
  @State() items: MaintenanceItem[];
  @State() loadFailed = false;

  componentWillLoad() {
    this.load();
  }

  @Watch('days')
  @Watch('apiBase')
  async load() {
    this.items = undefined;
    this.loadFailed = false;
    try {
      const api = new AmbulanceMaintenanceApi(new Configuration({ basePath: this.apiBase }));
      this.items = await api.getMaintenanceDue({ days: this.days });
    } catch {
      this.loadFailed = true;
    }
  }

  render() {
    const m = messages[this.language] ?? messages.en;
    const date = (iso: string) => new Date(iso).toLocaleDateString(m.locale);
    const today = new Date().setHours(0, 0, 0, 0);
    const daysUntil = (iso: string) => Math.round((new Date(iso).setHours(0, 0, 0, 0) - today) / 86_400_000);
    const deviceHref = (id: string) => `${this.basePath.replace(/\/?$/, '/')}devices/${encodeURIComponent(id)}`;

    return (
      <Host>
        <div class="container">
          <header>
            <p class="eyebrow">{m.eyebrow}</p>
            <h1>{m.title}</h1>
            <p class="intro">{m.intro}</p>
          </header>

          <label class="period">
            {m.within}
            <select onChange={ev => (this.days = Number((ev.target as HTMLSelectElement).value))}>
              {PERIODS.map(days => (
                <option value={days} selected={days === this.days}>
                  {m.days(days)}
                </option>
              ))}
            </select>
          </label>

          {this.loadFailed ? (
            <p class="message" role="alert">
              <span class="icon" aria-hidden="true">
                cloud_off
              </span>
              {m.loadFailed}
              <button type="button" onClick={() => this.load()}>
                {m.retry}
              </button>
            </p>
          ) : !this.items ? (
            <p class="message" aria-busy="true">
              {m.loading}…
            </p>
          ) : this.items.length === 0 ? (
            <p class="message">
              <span class="icon" aria-hidden="true">
                task_alt
              </span>
              {m.empty}
            </p>
          ) : (
            <ul class="items">
              {this.items.map(item => {
                const left = daysUntil(item.nextServiceAt);
                return (
                  <li class={{ item: true, overdue: item.overdue }}>
                    <a href={deviceHref(item.id)}>
                      <span class="icon" aria-hidden="true">
                        engineering
                      </span>
                      <span class="main">
                        <strong>{item.name}</strong>
                        <span class="sub">
                          {item.deviceId}
                          {item.department?.name && ` · ${item.department.name}`} ·{' '}
                          {m.interval(item.serviceIntervalDays)}
                        </span>
                        <span class="sub">
                          {m.lastService}: {item.lastServiceAt ? date(item.lastServiceAt) : m.never}
                          {item.lastServiceAt && ` · ${m.nextService}: ${date(item.nextServiceAt)}`}
                        </span>
                      </span>
                      <span class="status">{item.overdue ? m.overdue : m.dueIn(left)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Host>
    );
  }
}
