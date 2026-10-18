import { Component, Element, Host, Prop, State, h } from '@stencil/core';
import { MaintenanceItem } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { addDays, dayKey, monthWeeks, weekdayIndex } from '../../utils/calendar';
import { downloadText } from '../../utils/csv';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { formatDate, t } from '../../utils/i18n';
import { toIcs } from '../../utils/ics';
import { hrefTo } from '../../utils/utils';

const PERIODS = [30, 90, 365];

/** The longest period the API accepts; the calendar shows all of it. */
const CALENDAR_DAYS = 365;

type View = 'list' | 'calendar';

/** Days from today to the given date, counted in whole calendar days. */
function daysUntil(iso: string, now = new Date()): number {
  const day = (date: Date) => new Date(date).setHours(0, 0, 0, 0);
  return Math.round((day(new Date(iso)) - day(now)) / 86_400_000);
}

/** Arrow keys move by a day or a week, Home and End to the ends of the week. */
const KEY_MOVES: Record<string, (day: Date) => number> = {
  ArrowLeft: () => -1,
  ArrowRight: () => 1,
  ArrowUp: () => -7,
  ArrowDown: () => 7,
  Home: day => -weekdayIndex(day),
  End: day => 6 - weekdayIndex(day),
};

@Component({
  tag: 'harkap-ambulance-maintenance',
  styleUrls: ['harkap-ambulance-maintenance.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceMaintenance {
  @Element() el: HTMLElement;
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() view: View = 'list';
  @State() days = PERIODS[0];
  @State() selected = new Date();
  @State() items: MaintenanceItem[];
  @State() errorMessage: string;
  @State() errorStatus: number;

  private focusSelected = false;

  componentWillLoad() {
    this.load();
  }

  componentDidRender() {
    if (this.focusSelected) {
      this.focusSelected = false;
      this.el.shadowRoot.querySelector<HTMLElement>('.calendar td[tabindex="0"]')?.focus();
    }
  }

  private async load() {
    this.items = undefined;
    try {
      const days = this.view === 'calendar' ? CALENDAR_DAYS : this.days;
      this.items = await apiClients(this.apiBase).maintenance.getMaintenanceDue({ days });
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().maintenance.loadFailed}: ${message}`;
    }
  }

  private setView(view: View) {
    if (view !== this.view) {
      this.view = view;
      this.load();
    }
  }

  private select(day: Date, focus = true) {
    this.selected = day;
    this.focusSelected = focus;
  }

  private moveMonth(months: number) {
    const { selected } = this;
    const lastDay = new Date(selected.getFullYear(), selected.getMonth() + months + 1, 0).getDate();
    this.select(
      new Date(selected.getFullYear(), selected.getMonth() + months, Math.min(selected.getDate(), lastDay)),
      false,
    );
  }

  private onGridKey(ev: KeyboardEvent) {
    if (ev.key === 'PageUp' || ev.key === 'PageDown') {
      this.moveMonth(ev.key === 'PageUp' ? -1 : 1);
      this.focusSelected = true;
    } else if (KEY_MOVES[ev.key]) {
      this.select(addDays(this.selected, KEY_MOVES[ev.key](this.selected)));
    } else {
      return;
    }
    ev.preventDefault();
  }

  private exportIcs() {
    const m = t().maintenance;
    const events = this.items.map(item => {
      const date = dayKey(new Date(item.nextServiceAt));
      return {
        uid: `${item.id}-${date}@ambulance-devices`,
        date,
        summary: m.icsSummary(`${item.name} (${item.deviceId})`),
        url: new URL(hrefTo(this.basePath, './devices/' + encodeURIComponent(item.id)), location.origin).href,
      };
    });
    downloadText(`${m.icsFile}.ics`, toIcs(events), 'text/calendar');
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

          <div class="toolbar">
            <div class="segmented" role="group" aria-label={m.view}>
              {(['list', 'calendar'] as View[]).map(view => (
                <button type="button" aria-pressed={String(this.view === view)} onClick={() => this.setView(view)}>
                  <md-icon aria-hidden="true">{view === 'list' ? 'view_list' : 'calendar_month'}</md-icon>
                  {view === 'list' ? m.viewList : m.viewCalendar}
                </button>
              ))}
            </div>
            {this.view === 'list' && (
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
            )}
            <md-outlined-button class="export" disabled={!this.items?.length} onClick={() => this.exportIcs()}>
              <md-icon slot="icon" aria-hidden="true">
                event
              </md-icon>
              {m.exportIcs}
            </md-outlined-button>
          </div>

          {!this.items ? (
            <div class="card">
              <SkeletonRows count={3} />
            </div>
          ) : this.view === 'calendar' ? (
            this.renderCalendar(this.items)
          ) : this.items.length === 0 ? (
            <p class="empty">
              <md-icon aria-hidden="true">task_alt</md-icon>
              {m.empty}
            </p>
          ) : (
            <ul class="items">{this.items.map(item => this.renderItem(item))}</ul>
          )}
        </div>
      </Host>
    );
  }

  private renderItem(item: MaintenanceItem) {
    const m = t().maintenance;
    return (
      <li class={{ item: true, overdue: item.overdue }}>
        <a href={hrefTo(this.basePath, './devices/' + encodeURIComponent(item.id))}>
          <md-icon aria-hidden="true">engineering</md-icon>
          <span class="main">
            <strong>{item.name}</strong>
            <span class="sub">
              {[item.deviceId, item.department?.name, m.interval(item.serviceIntervalDays)].filter(Boolean).join(' · ')}
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
    );
  }

  private renderCalendar(items: MaintenanceItem[]) {
    const m = t().maintenance;
    const { locale } = t();
    const byDay = new Map<string, MaintenanceItem[]>();
    for (const item of items) {
      const key = dayKey(new Date(item.nextServiceAt));
      byDay.set(key, [...(byDay.get(key) ?? []), item]);
    }
    const month = this.selected.getMonth();
    const today = dayKey(new Date());
    const selectedKey = dayKey(this.selected);
    const selectedItems = byDay.get(selectedKey) ?? [];
    // 2024-01-01 was a Monday
    const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));
    const longDate = (day: Date) =>
      day.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div class="calendar-view">
        <p class="hint">{m.calendarHint}</p>
        <div class="calendar-head">
          <md-icon-button aria-label={m.previousMonth} title={m.previousMonth} onClick={() => this.moveMonth(-1)}>
            <md-icon aria-hidden="true">chevron_left</md-icon>
          </md-icon-button>
          <h2 id="month" aria-live="polite">
            {this.selected.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </h2>
          <md-icon-button aria-label={m.nextMonth} title={m.nextMonth} onClick={() => this.moveMonth(1)}>
            <md-icon aria-hidden="true">chevron_right</md-icon>
          </md-icon-button>
        </div>
        <table
          class="calendar"
          role="grid"
          aria-labelledby="month"
          onKeyDown={(ev: KeyboardEvent) => this.onGridKey(ev)}
        >
          <thead>
            <tr>
              {weekdays.map(day => (
                <th scope="col" abbr={day.toLocaleDateString(locale, { weekday: 'long' })}>
                  {day.toLocaleDateString(locale, { weekday: 'short' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthWeeks(this.selected).map(week => (
              <tr>
                {week.map(day => {
                  const key = dayKey(day);
                  const due = byDay.get(key) ?? [];
                  const overdue = due.filter(item => item.overdue).length;
                  const label = [
                    longDate(day),
                    due.length && m.devices(due.length),
                    overdue && m.overdueCount(overdue),
                  ];
                  return (
                    <td
                      class={{
                        day: true,
                        outside: day.getMonth() !== month,
                        due: due.length > 0,
                        overdue: overdue > 0,
                      }}
                      tabindex={key === selectedKey ? 0 : -1}
                      aria-selected={String(key === selectedKey)}
                      aria-current={key === today ? 'date' : undefined}
                      onClick={() => this.select(day)}
                    >
                      <span class="date" aria-hidden="true">
                        {day.getDate()}
                      </span>
                      <span class="visually-hidden">{label.filter(Boolean).join(', ')}</span>
                      {due.slice(0, 2).map(item => (
                        <span class="chip">{item.name}</span>
                      ))}
                      {due.length > 2 && <span class="more">+{due.length - 2}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <section class="agenda" aria-labelledby="agenda-title">
          <h3 id="agenda-title">{longDate(this.selected)}</h3>
          {selectedItems.length ? (
            <ul class="items">{selectedItems.map(item => this.renderItem(item))}</ul>
          ) : (
            <p class="empty">
              <md-icon aria-hidden="true">event_available</md-icon>
              {m.noneOnDay}
            </p>
          )}
        </section>
      </div>
    );
  }
}
