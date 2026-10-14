import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { AmbulanceDeviceLogListApiFactory, DeviceLog } from '../../api/ambulance-wl';
import { ErrorPage } from '../../utils/error-page';
import { ConfirmDialog } from '../../utils/confirm-dialog';
import { toLocalDateTimeInput, validateOnBlur } from '../../utils/utils';

@Component({
  tag: 'harkap-ambulance-log-editor',
  styleUrls: ['harkap-ambulance-log-editor.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceLogEditor {
  @Prop() logId: string;
  @Prop() entryId: string;
  @Prop() apiBase: string;
  @State() log: DeviceLog;
  @State() errorMessage: string;
  @State() errorStatus: number;
  @State() isValid: boolean;
  @State() actionError: string;
  @State() busy = false;
  @State() confirmDelete = false;

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
        this.errorMessage = `Nepodarilo sa načítať záznam: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Nepodarilo sa načítať záznam: ${err.message || 'neznáma chyba'}`;
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
        {!this.log ? (
          <div class="form-skeleton" aria-busy="true" aria-label="Načítava sa">
            {[1, 2, 3].map(() => (
              <span class="skeleton"></span>
            ))}
          </div>
        ) : (
          <form onFocusout={validateOnBlur}>
            <md-outlined-text-field
              required
              value={this.log.text}
              oninput={(ev: InputEvent) => {
                this.log.text = this.inputValue(ev);
                this.isValid = this.isFormValid();
              }}
              label="Text"
            >
              <md-icon slot="leading-icon">notes</md-icon>
            </md-outlined-text-field>

            <md-outlined-text-field
              required
              value={this.log.deviceId}
              oninput={(ev: InputEvent) => {
                this.log.deviceId = this.inputValue(ev);
                this.isValid = this.isFormValid();
              }}
              label="ID zariadenia"
            >
              <md-icon slot="leading-icon">pin</md-icon>
            </md-outlined-text-field>

            <md-outlined-text-field
              type="datetime-local"
              required
              value={toLocalDateTimeInput(this.log.createdAt)}
              oninput={(ev: InputEvent) => {
                const date = new Date(this.inputValue(ev));
                if (!isNaN(date.getTime())) {
                  this.log.createdAt = date.toISOString();
                }
                this.isValid = this.isFormValid();
              }}
              label="Dátum a čas"
            >
              <md-icon slot="leading-icon">watch_later</md-icon>
            </md-outlined-text-field>
          </form>
        )}

        {this.actionError && (
          <div class="banner" role="alert">
            <md-icon>error</md-icon>
            <span>{this.actionError}</span>
          </div>
        )}

        <div class="actions">
          <md-text-button
            id="delete"
            disabled={!this.log || this.logId === '@new' || this.busy}
            onClick={() => (this.confirmDelete = true)}
          >
            <md-icon slot="icon">delete</md-icon>
            Zmazať
          </md-text-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.logClosed.emit('cancel')}>
            <md-icon slot="icon">close</md-icon>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm" disabled={!this.isValid || this.busy} onClick={() => this.updateEntry()}>
            <md-icon slot="icon">save</md-icon>
            {this.busy ? 'Ukladá sa…' : 'Uložiť'}
          </md-filled-button>
        </div>
        <ConfirmDialog
          open={this.confirmDelete}
          headline="Zmazať záznam?"
          text="Záznam bude natrvalo odstránený z prevádzkového logu."
          onCancel={() => (this.confirmDelete = false)}
          onConfirm={() => {
            this.confirmDelete = false;
            this.deleteEntry();
          }}
        />
      </Host>
    );
  }

  private isFormValid(): boolean {
    return this.log?.deviceId && this.log?.text && this.log?.createdAt && true;
  }

  private inputValue(ev: InputEvent): string {
    return (ev.target as HTMLInputElement).value;
  }

  private async updateEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const api = AmbulanceDeviceLogListApiFactory(undefined, this.apiBase);
      const response =
        this.logId === '@new'
          ? await api.createDeviceLog(this.entryId, this.log)
          : await api.updateDeviceLog(this.entryId, this.logId, this.log);
      if (response.status < 299) {
        this.logClosed.emit('store');
      } else {
        this.actionError = `Záznam sa nepodarilo uložiť: ${response.statusText}`;
      }
    } catch (err: any) {
      this.actionError = `Záznam sa nepodarilo uložiť: ${err.message || 'neznáma chyba'}`;
    } finally {
      this.busy = false;
    }
  }

  private async deleteEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const response = await AmbulanceDeviceLogListApiFactory(undefined, this.apiBase).deleteDeviceLog(
        this.entryId,
        this.logId,
      );
      if (response.status < 299) {
        this.logClosed.emit('delete');
      } else {
        this.actionError = `Záznam sa nepodarilo zmazať: ${response.statusText}`;
      }
    } catch (err: any) {
      this.actionError = `Záznam sa nepodarilo zmazať: ${err.message || 'neznáma chyba'}`;
    } finally {
      this.busy = false;
    }
  }
}
