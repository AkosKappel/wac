import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AmbulanceDeviceListApiFactory, DeviceListEntry } from '../../api/ambulance-wl';

@Component({
  tag: 'harkap-ambulance-wl-list',
  styleUrl: 'harkap-ambulance-wl-list.css',
  shadow: true,
})
export class HarkapAmbulanceWlList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @State() errorMessage: string;
  @State() searchText: string = '';

  devices: DeviceListEntry[];

  private async getDevicesAsync() {
    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).getDeviceListEntries();
      if (response.status < 299) {
        return response.data;
      } else {
        this.errorMessage = `Cannot retrieve list of devices: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of devices: ${err.message || 'unknown'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.devices = await this.getDevicesAsync();
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
    return (
      <Host>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="container">
            <h1>Nemocnica HarKap - Zoznam zdravotníckeho vybavenia</h1>
            <div class="header">
              <md-elevated-button class="add-button" onclick={() => this.entryClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                <span>Pridať nové zariadenie</span>
              </md-elevated-button>
              <md-filled-text-field
                class="search"
                label="Filtrovať zariadenia"
                onInput={(e: InputEvent) => (this.searchText = (e.target as HTMLInputElement).value)}
                placeholder="Zadajte názov zariadenia alebo oddelenia"
              >
                <md-icon slot="leading-icon">search</md-icon>
              </md-filled-text-field>
            </div>
            {this.devices ? (
              <md-list class="list">
                {this.filteredDevices().map(device => (
                  <md-list-item class="list-item" onClick={() => this.entryClicked.emit(device.id)}>
                    <div slot="headline">{device.name}</div>
                    <div slot="supporting-text">{'Oddelenie: ' + device.department.name}</div>
                    <md-icon slot="start">devices</md-icon>
                    <md-icon slot="end">chevron_right</md-icon>
                  </md-list-item>
                ))}
              </md-list>
            ) : (
              <div>Nenašli sa žiadne zariadenia</div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
