import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AmbulanceDeviceListApiFactory, DeviceListEntry } from '../../api/ambulance-wl';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
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
  @State() searchText: string = '';

  @State() devices: DeviceListEntry[];

  private async getDevicesAsync() {
    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).getDeviceListEntries();
      if (response.status < 299) {
        return response.data ?? [];
      } else {
        this.errorMessage = `Nepodarilo sa načítať zariadenia: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Nepodarilo sa načítať zariadenia: ${err.message || 'neznáma chyba'}`;
    }
    return [];
  }

  componentWillLoad() {
    this.getDevicesAsync().then(devices => (this.devices = devices));
  }

  private filteredDevices(): DeviceListEntry[] {
    const searchText = this.escapeRegExp(this.normalizeSearchText(this.searchText));
    const searchRegex = new RegExp(searchText.split('').join('.*?'), 'i');

    return this.devices?.filter((device: DeviceListEntry) => {
      const deviceName = this.normalizeSearchText(device.name);
      const departmentName = this.normalizeSearchText(device.department.name);
      return searchRegex.test(deviceName) || searchRegex.test(departmentName);
    });
  }

  private normalizeSearchText(text: string): string {
    return text
      .normalize('NFD') // Normalize diacritics
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .toLowerCase() // Convert to lowercase
      .trim(); // Remove leading and trailing spaces
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes RegExp special characters
  }

  render() {
    const devices = this.filteredDevices() ?? [];
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
                <p class="eyebrow">Nemocnica HarKap</p>
                <h1>Zdravotnícke vybavenie</h1>
              </div>
              <md-filled-button onclick={() => this.entryClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                Nové zariadenie
              </md-filled-button>
            </header>
            <section class="card">
              <div class="toolbar">
                <md-outlined-text-field
                  class="search"
                  placeholder="Hľadať podľa názvu alebo oddelenia"
                  onInput={(e: InputEvent) => (this.searchText = (e.target as HTMLInputElement).value)}
                >
                  <md-icon slot="leading-icon">search</md-icon>
                </md-outlined-text-field>
                <span class="count">{this.devices ? `${devices.length} zariadení` : ''}</span>
              </div>
              {!this.devices ? (
                <SkeletonRows count={4} />
              ) : devices.length ? (
                <md-list class="list">
                  {devices.map(device => (
                    <md-list-item class="list-item" type="button" onClick={() => this.entryClicked.emit(device.id)}>
                      <div slot="start" class="avatar">
                        <md-icon>medical_services</md-icon>
                      </div>
                      <div slot="headline">{device.name}</div>
                      <div slot="supporting-text">
                        {device.department.name}
                        {device.deviceId ? ` · ${device.deviceId}` : ''}
                      </div>
                      <div slot="end" class="meta">
                        {device.warrantyUntil && <WarrantyBadge until={device.warrantyUntil} />}
                        <md-icon>chevron_right</md-icon>
                      </div>
                    </md-list-item>
                  ))}
                </md-list>
              ) : (
                <div class="empty">
                  <md-icon>inventory_2</md-icon>
                  <p>Nenašli sa žiadne zariadenia</p>
                </div>
              )}
            </section>
          </div>
        )}
      </Host>
    );
  }
}
