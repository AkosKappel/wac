import { Component, Event, Host, Prop, EventEmitter, State, h } from '@stencil/core';
import { AmbulanceDeviceLogListApiFactory, DeviceLog } from '../../api/ambulance-wl';
import { ErrorPage } from '../../utils/error-page';

@Component({
  tag: 'harkap-ambulance-log-list',
  styleUrls: ['harkap-ambulance-log-list.css', '../../utils/error-page.css'],
  shadow: true,
})
export class HarkapAmbulanceLogList {
  @Event({ eventName: 'log-clicked' }) logClicked: EventEmitter<string>;
  @State() errorMessage: string;
  @State() errorStatus: number;
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
      this.errorStatus = err.response?.status;
      this.errorMessage = `Cannot retrieve device logs: ${err.message || 'unknown'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.deviceLogs = await this.getDeviceLogsAsync();
  }

  private filteredLogs() {
    return this.deviceLogs;
  }

  render() {
    return (
      <Host>
        {this.errorMessage ? (
          <ErrorPage status={this.errorStatus} message={this.errorMessage} />
        ) : (
          <div class="container">
            <md-outlined-button class="add-button" onclick={() => this.logClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>
              Pridať záznam
            </md-outlined-button>
            {this.deviceLogs.length > 0 ? (
              <md-list class="list">
                {this.filteredLogs().map(log => (
                  <md-list-item class="list-item" type="button" onClick={() => this.logClicked.emit(log.id)}>
                    <md-icon slot="start">description</md-icon>
                    <div slot="headline">{log.text}</div>
                    <div slot="supporting-text">
                      {new Date(log.createdAt).toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <md-icon slot="end">chevron_right</md-icon>
                  </md-list-item>
                ))}
              </md-list>
            ) : (
              <div class="empty">Zariadenie zatiaľ nemá žiadne záznamy</div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
