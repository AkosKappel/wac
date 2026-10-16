import { Component, Event, Host, Prop, EventEmitter, State, h } from '@stencil/core';
import { DeviceLog, LogType } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ErrorPage, SkeletonRows } from '../../utils/error-page';
import { formatDateTime, t } from '../../utils/i18n';
import { LOG_TYPES, LOG_TYPE_ICONS } from '../../utils/service';

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
  @State() typeFilter: LogType | '' = '';

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
    return this.typeFilter ? this.deviceLogs.filter(log => (log.type ?? 'other') === this.typeFilter) : this.deviceLogs;
  }

  render() {
    const m = t().logList;
    return (
      <Host>
        {this.errorMessage ? (
          <ErrorPage status={this.errorStatus} message={this.errorMessage} />
        ) : (
          <div class="container">
            <div class="toolbar">
              <md-outlined-button onclick={() => this.logClicked.emit('@new')}>
                <md-icon slot="icon">add</md-icon>
                {m.add}
              </md-outlined-button>
              <md-outlined-select
                label={m.type}
                value={this.typeFilter || 'all'}
                onChange={(ev: Event) => {
                  const value = (ev.target as HTMLSelectElement).value;
                  this.typeFilter = value === 'all' ? '' : (value as LogType);
                }}
              >
                <md-select-option value="all">
                  <div slot="headline">{m.allTypes}</div>
                </md-select-option>
                {LOG_TYPES.map(type => (
                  <md-select-option value={type}>
                    <md-icon slot="start" aria-hidden="true">
                      {LOG_TYPE_ICONS[type]}
                    </md-icon>
                    <div slot="headline">{t().logTypes[type]}</div>
                  </md-select-option>
                ))}
              </md-outlined-select>
            </div>
            {!this.deviceLogs ? (
              <div class="list">
                <SkeletonRows />
              </div>
            ) : this.filteredLogs().length > 0 ? (
              <md-list class="list">
                {this.filteredLogs().map(log => {
                  const type = log.type ?? 'other';
                  return (
                    <md-list-item class="list-item" type="button" onClick={() => this.logClicked.emit(log.id)}>
                      <md-icon slot="start" aria-hidden="true">
                        {LOG_TYPE_ICONS[type]}
                      </md-icon>
                      <div slot="headline">{log.text}</div>
                      <div slot="supporting-text">
                        {t().logTypes[type]} · {formatDateTime(log.createdAt)}
                      </div>
                      <md-icon slot="end" aria-hidden="true">
                        chevron_right
                      </md-icon>
                    </md-list-item>
                  );
                })}
              </md-list>
            ) : (
              <div class="empty">{this.deviceLogs.length ? m.emptyFiltered : m.empty}</div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
