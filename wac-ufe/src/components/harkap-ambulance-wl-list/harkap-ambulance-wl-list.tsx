import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Department, DeviceListEntry } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { downloadText, toCsv } from '../../utils/csv';
import { DeviceQuery, applyQuery, parseQuery, toSearch } from '../../utils/device-query';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { t } from '../../utils/i18n';
import { WarrantyBadge } from '../../utils/warranty-badge';

@Component({
  tag: 'harkap-ambulance-wl-list',
  styleUrls: ['harkap-ambulance-wl-list.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceWlList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @State() errorMessage: string;
  @State() errorStatus: number;
  @State() query: DeviceQuery = parseQuery(location.search);

  @State() devices: DeviceListEntry[];

  private async getDevicesAsync() {
    try {
      return (await apiClients(this.apiBase).devices.getDeviceListEntries()) ?? [];
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().list.loadFailed}: ${message}`;
      return [];
    }
  }

  componentWillLoad() {
    this.getDevicesAsync().then(devices => (this.devices = devices));
  }

  private filteredDevices(): DeviceListEntry[] {
    return this.devices && applyQuery([...this.devices], this.query, t().locale);
  }

  private setQuery(change: Partial<DeviceQuery>) {
    this.query = { ...this.query, ...change };
    // replace, not push: typing in the search box should not fill the back button history
    history.replaceState(history.state, '', location.pathname + toSearch(this.query));
  }

  /** The departments that have devices, by name. */
  private departments(): Department[] {
    const byCode = new Map((this.devices ?? []).map(device => [device.department?.code, device.department]));
    byCode.delete(undefined);
    return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name, t().locale));
  }

  private exportCsv(devices: DeviceListEntry[]) {
    const m = t().list;
    const rows = devices.map(device => [
      device.id,
      device.name,
      device.deviceId,
      device.department?.name ?? '',
      device.warrantyUntil?.substring(0, 10) ?? '',
      device.price ?? 0,
    ]);
    downloadText(`${m.csvFile}-${new Date().toISOString().substring(0, 10)}.csv`, toCsv([m.csvHeader, ...rows]));
  }

  render() {
    const devices = this.filteredDevices() ?? [];
    const m = t().list;
    const filtered = this.query.q || this.query.department || this.query.warranty;
    const selectValue = (ev: Event) => (ev.target as HTMLSelectElement).value;
    return (
      <Host>
        {this.errorMessage ? (
          <div class="container">
            <ErrorPage status={this.errorStatus} message={this.errorMessage} />
          </div>
        ) : (
          <div class="container">
            <header class="page-header">
              <div>
                <p class="eyebrow">{m.eyebrow}</p>
                <h1>{m.title}</h1>
              </div>
              <md-filled-button onclick={() => this.entryClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                {m.newDevice}
              </md-filled-button>
            </header>
            <section class="card">
              <div class="toolbar">
                <md-outlined-text-field
                  class="search"
                  placeholder={m.search}
                  aria-label={m.search}
                  value={this.query.q}
                  onInput={(e: InputEvent) => this.setQuery({ q: (e.target as HTMLInputElement).value })}
                >
                  <md-icon slot="leading-icon">search</md-icon>
                </md-outlined-text-field>
                <span class="count">{this.devices ? m.count(devices.length) : ''}</span>
                <md-outlined-button disabled={!devices.length} onClick={() => this.exportCsv(devices)}>
                  <md-icon slot="icon">download</md-icon>
                  {m.exportCsv}
                </md-outlined-button>
              </div>
              <div class="filters">
                {/* a new select once the devices arrive: Material Web ignores a value set before its options */}
                <md-outlined-select
                  key={this.devices ? 'departments' : 'loading'}
                  label={m.department}
                  value={this.query.department || 'all'}
                  onChange={(ev: Event) =>
                    this.setQuery({ department: selectValue(ev) === 'all' ? '' : selectValue(ev) })
                  }
                >
                  <md-select-option value="all">
                    <div slot="headline">{m.allDepartments}</div>
                  </md-select-option>
                  {this.departments().map(department => (
                    <md-select-option value={department.code}>
                      <div slot="headline">{department.name}</div>
                    </md-select-option>
                  ))}
                </md-outlined-select>
                <md-outlined-select
                  label={m.warranty}
                  value={this.query.warranty || 'all'}
                  onChange={(ev: Event) =>
                    this.setQuery({
                      warranty: selectValue(ev) === 'all' ? '' : (selectValue(ev) as DeviceQuery['warranty']),
                    })
                  }
                >
                  {[
                    ['all', m.allWarranties],
                    ['ok', m.warrantyOk],
                    ['expiring', m.warrantyExpiring],
                    ['expired', m.warrantyExpired],
                  ].map(([value, label]) => (
                    <md-select-option value={value}>
                      <div slot="headline">{label}</div>
                    </md-select-option>
                  ))}
                </md-outlined-select>
                <md-outlined-select
                  label={m.sort}
                  value={this.query.sort}
                  onChange={(ev: Event) => this.setQuery({ sort: selectValue(ev) as DeviceQuery['sort'] })}
                >
                  {[
                    ['name', m.sortName],
                    ['warranty', m.sortWarranty],
                    ['price', m.sortPrice],
                  ].map(([value, label]) => (
                    <md-select-option value={value}>
                      <div slot="headline">{label}</div>
                    </md-select-option>
                  ))}
                </md-outlined-select>
                {filtered && (
                  <md-text-button onClick={() => this.setQuery({ q: '', department: '', warranty: '' })}>
                    <md-icon slot="icon">filter_alt_off</md-icon>
                    {m.clearFilters}
                  </md-text-button>
                )}
              </div>
              {!this.devices ? (
                <SkeletonRows count={4} />
              ) : devices.length ? (
                <md-list class="list">
                  {devices.map(device => (
                    <md-list-item class="list-item" type="button" onClick={() => this.entryClicked.emit(device.id)}>
                      <div slot="start" class="avatar">
                        <md-icon aria-hidden="true">medical_services</md-icon>
                      </div>
                      <div slot="headline">{device.name}</div>
                      <div slot="supporting-text">
                        {device.department?.name}
                        {device.deviceId ? ` · ${device.deviceId}` : ''}
                      </div>
                      <div slot="end" class="meta">
                        {device.warrantyUntil && <WarrantyBadge until={device.warrantyUntil} />}
                        <md-icon aria-hidden="true">chevron_right</md-icon>
                      </div>
                    </md-list-item>
                  ))}
                </md-list>
              ) : (
                <div class="empty">
                  <md-icon aria-hidden="true">inventory_2</md-icon>
                  <p>{m.empty}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </Host>
    );
  }
}
