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

  render() {
    return (
      <Host>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="container">
            <h1>Nemocnica HarKap - Zoznam zdravotníckeho vybavenia</h1>
            <md-elevated-button class="add-button" onclick={() => this.entryClicked.emit('@new')}>
              <span>Pridať nové zariadenie</span>
            </md-elevated-button>
            {this.devices ? (
              <md-list class="list">
                {this.devices?.map(device => (
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
