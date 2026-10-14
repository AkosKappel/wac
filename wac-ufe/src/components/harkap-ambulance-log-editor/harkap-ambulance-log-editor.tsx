import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { DeviceLog } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ErrorPage } from '../../utils/error-page';
import { ConfirmDialog } from '../../utils/confirm-dialog';
import { t } from '../../utils/i18n';
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
      this.log = await apiClients(this.apiBase).logs.getDeviceLog({ entryId: this.entryId, logId: this.logId });
      this.isValid = true;
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().logEditor.loadFailed}: ${message}`;
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

    const m = t().logEditor;
    const common = t().common;
    return (
      <Host>
        <h3>{this.logId === '@new' ? m.titleNew : m.titleEdit}</h3>
        {!this.log ? (
          <div class="form-skeleton" aria-busy="true" aria-label={common.loading}>
            {[1, 2, 3].map(() => (
              <span class="skeleton"></span>
            ))}
          </div>
        ) : (
          <form onFocusout={validateOnBlur}>
            <md-outlined-text-field
              required
              maxLength={1000}
              value={this.log.text}
              oninput={(ev: InputEvent) => {
                this.log.text = this.inputValue(ev);
                this.isValid = this.isFormValid();
              }}
              label={m.text}
            >
              <md-icon slot="leading-icon">notes</md-icon>
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
              label={m.dateTime}
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
            {common.delete}
          </md-text-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.logClosed.emit('cancel')}>
            <md-icon slot="icon">close</md-icon>
            {common.cancel}
          </md-outlined-button>
          <md-filled-button id="confirm" disabled={!this.isValid || this.busy} onClick={() => this.updateEntry()}>
            <md-icon slot="icon">save</md-icon>
            {this.busy ? common.saving : common.save}
          </md-filled-button>
        </div>
        <ConfirmDialog
          open={this.confirmDelete}
          headline={m.deleteTitle}
          text={m.deleteText}
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
    return this.log?.text && this.log?.createdAt && true;
  }

  private inputValue(ev: InputEvent): string {
    return (ev.target as HTMLInputElement).value;
  }

  private async updateEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const logs = apiClients(this.apiBase).logs;
      if (this.logId === '@new') {
        await logs.createDeviceLog({ entryId: this.entryId, deviceLog: this.log });
      } else {
        await logs.updateDeviceLog({ entryId: this.entryId, logId: this.logId, deviceLog: this.log });
      }
      this.logClosed.emit('store');
    } catch (err) {
      this.actionError = `${t().logEditor.saveFailed}: ${(await apiError(err)).message}`;
    } finally {
      this.busy = false;
    }
  }

  private async deleteEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      await apiClients(this.apiBase).logs.deleteDeviceLog({ entryId: this.entryId, logId: this.logId });
      this.logClosed.emit('delete');
    } catch (err) {
      this.actionError = `${t().logEditor.deleteFailed}: ${(await apiError(err)).message}`;
    } finally {
      this.busy = false;
    }
  }
}
