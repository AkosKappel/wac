import { Component, Event, Host, Prop, EventEmitter, State, h } from '@stencil/core';
import { AmbulanceDeviceLogListApiFactory, DeviceLog } from '../../api/ambulance-wl';

@Component({
  tag: 'harkap-ambulance-log-list',
  styleUrl: 'harkap-ambulance-log-list.css',
  shadow: true,
})
export class HarkapAmbulanceLogList {
  @Event({ eventName: 'log-clicked' }) logClicked: EventEmitter<string>;
  @State() errorMessage: string;
  @Prop() apiBase: string;
  @Prop() deviceId: string;

  deviceLogs: DeviceLog[];

  private async getDeviceLogsAsync() {
    try {
      const response = await AmbulanceDeviceLogListApiFactory(undefined, this.apiBase).getDeviceLogs(this.deviceId);
      if (response.status < 299) {
        return response.data;
      } else {
        this.errorMessage = `Cannot retrieve device logs: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve device logs: ${err.message || 'unknown'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.deviceLogs = await this.getDeviceLogsAsync();
  }

  render() {
    return (
      <Host>
        {this.errorMessage ? (
          <div class="error">{this.errorMessage}</div>
        ) : (
          <div class="container">
            <md-elevated-button class="add-button" onclick={() => this.logClicked.emit('@new')}>
              <span>Pridať nový log</span>
            </md-elevated-button>
            {this.deviceLogs.length > 0 ? (
              <md-list class="list">
                {this.deviceLogs.map(device => (
                  <md-list-item class="list-item" onClick={() => this.logClicked.emit(device.id)}>
                    <div slot="headline">
                      <b>ID: </b>
                      {device.id}
                    </div>
                    <div slot="headline">
                      <b>Typ: </b>
                      {device.text}
                    </div>
                    <div slot="supporting-text">
                      <b>Čas: </b>
                      {device.createdAt}
                    </div>
                  </md-list-item>
                ))}
              </md-list>
            ) : (
              <div class="empty">Zariadenie nemá žiadne logy</div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
