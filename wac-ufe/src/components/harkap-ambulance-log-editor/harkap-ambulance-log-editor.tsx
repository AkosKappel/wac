import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { AmbulanceDeviceLogListApiFactory, DeviceLog } from '../../api/ambulance-wl';
import { ErrorPage } from '../../utils/error-page';

@Component({
  tag: 'harkap-ambulance-log-editor',
  styleUrls: ['harkap-ambulance-log-editor.css', '../../utils/error-page.css'],
  shadow: true,
})
export class HarkapAmbulanceLogEditor {
  @Prop() logId: string;
  @Prop() entryId: string;
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @State() log: DeviceLog;
  @State() errorMessage: string;
  @State() errorStatus: number;
  @State() isValid: boolean;

  private async getDeviceLogAsync(): Promise<DeviceLog> {
    if (this.logId === '@new') {
      this.isValid = false;
      const uniqueId = () => Math.random().toString(36).substr(2, 9);

      this.log = {
        id: uniqueId(),
        deviceId: '',
        createdAt: new Date().toISOString(),
        text: '',
      };

      return this.log;
    }

    if (!this.logId) {
      this.isValid = false;
      return undefined;
    }

    try {
      const response = await AmbulanceDeviceLogListApiFactory(undefined, this.apiBase).getDeviceLog(
        this.entryId,
        this.logId,
      );

      if (response.status < 299) {
        this.log = response.data;
        this.isValid = true;
      } else {
        this.errorMessage = `Cannot retrieve log: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Cannot retrieve log: ${err.message || 'unknown'}`;
    }

    return undefined;
  }

  async componentWillLoad() {
    this.getDeviceLogAsync();
  }

  @Event({ eventName: 'log-closed' }) logClosed: EventEmitter<string>;

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <ErrorPage status={this.errorStatus} message={this.errorMessage} onBack={() => this.logClosed.emit('cancel')} />
        </Host>
      );
    }

    return (
      <Host>
        <h3>{this.logId === '@new' ? 'Nový záznam' : 'Upraviť záznam'}</h3>
        <form>
          <md-outlined-text-field
            required
            value={this.log?.text}
            oninput={(ev: InputEvent) => {
              if (this.log) {
                this.log.text = this.handleInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="Text"
          >
            <md-icon slot="leading-icon">notes</md-icon>
          </md-outlined-text-field>

          <md-outlined-text-field
            required
            value={this.log?.deviceId}
            oninput={(ev: InputEvent) => {
              if (this.log) {
                this.log.deviceId = this.handleInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="ID zariadenia"
          >
            <md-icon slot="leading-icon">pin</md-icon>
          </md-outlined-text-field>

          <md-outlined-text-field
            type="date"
            required
            value={(this.log?.createdAt ? new Date(this.log?.createdAt) : new Date()).toISOString().substring(0, 10)}
            oninput={(ev: InputEvent) => {
              if (this.log) {
                this.log.createdAt = this.handleDateInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="Dátum a čas"
          >
            <md-icon slot="leading-icon">watch_later</md-icon>
          </md-outlined-text-field>
        </form>

        <div class="actions">
          <md-text-button
            id="delete"
            disabled={!this.log || this.log?.id === '@new'}
            onClick={() => this.deleteEntry()}
          >
            <md-icon slot="icon">delete</md-icon>
            Zmazať
          </md-text-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.logClosed.emit('cancel')}>
            <md-icon slot="icon">close</md-icon>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm" disabled={!this.isValid} onClick={() => this.updateEntry()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
      </Host>
    );
  }

  private isFormValid(): boolean {
    return this.log?.deviceId && this.log?.text && this.log?.createdAt && true;
  }

  private handleInputEvent(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;

    // Check validity of the current input element
    const isValid = target.reportValidity();
    this.isValid = isValid;

    return target.value;
  }

  private handleDateInputEvent(ev: InputEvent): string {
    const target = ev.target as HTMLInputElement;
    const date = new Date(target.value);

    if (isNaN(date.getTime())) {
      target.setCustomValidity('Invalid date format');
    } else {
      target.setCustomValidity('');
    }

    return date.toISOString();
  }

  private async updateEntry() {
    try {
      const api = AmbulanceDeviceLogListApiFactory(undefined, this.apiBase);
      const response =
        this.logId === '@new'
          ? await api.createDeviceLog(this.entryId, this.log)
          : await api.updateDeviceLog(this.entryId, this.logId, this.log);
      if (response.status < 299) {
        this.logClosed.emit('store');
      } else {
        this.errorMessage = `Cannot store log: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Cannot store log: ${err.message || 'unknown'}`;
    }
  }

  private async deleteEntry() {
    try {
      const response = await AmbulanceDeviceLogListApiFactory(undefined, this.apiBase).deleteDeviceLog(
        this.entryId,
        this.logId,
      );
      if (response.status < 299) {
        this.logClosed.emit('delete');
      } else {
        this.errorMessage = `Cannot delete log: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Cannot delete log: ${err.message || 'unknown'}`;
    }
  }
}
