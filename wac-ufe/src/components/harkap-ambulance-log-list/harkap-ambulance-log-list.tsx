import { Component, Event, Host, Prop, EventEmitter, State, h } from '@stencil/core';
import { DeviceLog } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { formatDateTime, t } from '../../utils/i18n';

@Component({
  tag: 'harkap-ambulance-log-list',
  styleUrls: ['harkap-ambulance-log-list.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceLogList {
  @Event({ eventName: 'log-clicked' }) logClicked: EventEmitter<string>;
  @State() errorMessage: string;
  @State() errorStatus: number;
  @Prop() apiBase: string;
  @Prop() deviceId: string;

  @State() deviceLogs: DeviceLog[];

  private async getDeviceLogsAsync() {
    try {
      return (await apiClients(this.apiBase).logs.getDeviceLogs({ entryId: this.deviceId })) ?? [];
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().logList.loadFailed}: ${message}`;
      return [];
    }
  }

  componentWillLoad() {
    this.getDeviceLogsAsync().then(logs => (this.deviceLogs = logs));
  }

  private filteredLogs() {
    return this.deviceLogs;
  }

  render() {
    const m = t().logList;
    return (
      <Host>
        {this.errorMessage ? (
          <ErrorPage status={this.errorStatus} message={this.errorMessage} />
        ) : (
          <div class="container">
            <md-outlined-button class="add-button" onclick={() => this.logClicked.emit('@new')}>
              <md-icon slot="icon">add</md-icon>
              {m.add}
            </md-outlined-button>
            {!this.deviceLogs ? (
              <div class="list">
                <SkeletonRows />
              </div>
            ) : this.deviceLogs.length > 0 ? (
              <md-list class="list">
                {this.filteredLogs().map(log => (
                  <md-list-item class="list-item" type="button" onClick={() => this.logClicked.emit(log.id)}>
                    <md-icon slot="start">description</md-icon>
                    <div slot="headline">{log.text}</div>
                    <div slot="supporting-text">{formatDateTime(log.createdAt)}</div>
                    <md-icon slot="end">chevron_right</md-icon>
                  </md-list-item>
                ))}
              </md-list>
            ) : (
              <div class="empty">{m.empty}</div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
