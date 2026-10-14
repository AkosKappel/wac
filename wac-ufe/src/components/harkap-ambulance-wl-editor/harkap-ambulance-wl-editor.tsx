import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { AmbulanceDeviceListApiFactory, DeviceListEntry } from '../../api/ambulance-wl';
import { ErrorPage } from '../../utils/error-page';
import { ConfirmDialog } from '../../utils/confirm-dialog';
import { navigateTo, watchRelativePath, validateOnBlur } from '../../utils/utils';

@Component({
  tag: 'harkap-ambulance-wl-editor',
  styleUrls: ['harkap-ambulance-wl-editor.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceWlEditor {
  @State() private relativePath = '';
  @Prop() entryId: string;
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @State() entry: DeviceListEntry;
  @State() errorMessage: string;
  @State() errorStatus: number;
  @State() isValid: boolean;
  @State() actionError: string;
  @State() busy = false;
  @State() confirmDelete = false;

  private unwatch: () => void;

  private departments = [
    { value: 'chir', name: 'Chirurgia' },
    { value: 'dets', name: 'Detské' },
    { value: 'ort', name: 'Ortopedické' },
    { value: 'ped', name: 'Pediatrické' },
    { value: 'int', name: 'Interné' },
  ];

  private async getDeviceEntryAsync(): Promise<DeviceListEntry> {
    if (this.entryId === '@new') {
      this.isValid = false;

      const uniqueId = () => Math.random().toString(36).substr(2, 9);

      this.entry = {
        id: uniqueId(),
        name: '',
        deviceId: '',
        warrantyUntil: new Date().toISOString(),
        department: { name: '' },
        price: 0,
      };

      return this.entry;
    }

    if (!this.entryId) {
      this.isValid = false;
      return undefined;
    }

    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).getDeviceListEntry(this.entryId);

      if (response.status < 299) {
        this.entry = response.data;
        this.isValid = true;
      } else {
        this.errorMessage = `Nepodarilo sa načítať zariadenie: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorStatus = err.response?.status;
      this.errorMessage = `Nepodarilo sa načítať zariadenie: ${err.message || 'neznáma chyba'}`;
    }

    return undefined;
  }

  componentWillLoad() {
    this.getDeviceEntryAsync();
  }

  connectedCallback() {
    this.unwatch = watchRelativePath(this.basePath, path => (this.relativePath = path));
  }

  disconnectedCallback() {
    this.unwatch?.();
  }

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  // includes the entry's own department when it is not in the predefined list
  private departmentOptions() {
    const current = this.entry?.department;
    return current?.code && !this.departments.some(d => d.value === current.code)
      ? [...this.departments, { value: current.code, name: current.name }]
      : this.departments;
  }

  render() {
    let element = 'list';
    let logId = '@new';

    if (this.relativePath.includes('log/')) {
      element = 'editor';
      logId = this.relativePath.split('/')[3];
    }

    const navigate = (path: string) => navigateTo(this.basePath, path);

    if (this.errorMessage) {
      return (
        <Host>
          <ErrorPage status={this.errorStatus} message={this.errorMessage} onBack={() => this.editorClosed.emit('cancel')} />
        </Host>
      );
    }

    return (
      <Host>
        <header class="page-header">
          <md-icon-button aria-label="Späť na zoznam" onClick={() => this.editorClosed.emit('cancel')}>
            <md-icon>arrow_back</md-icon>
          </md-icon-button>
          <div>
            <p class="eyebrow">{this.entryId === '@new' ? 'Nové zariadenie' : 'Detail zariadenia'}</p>
            <h1>{this.entryId === '@new' ? 'Pridať zariadenie' : this.entry?.name || '…'}</h1>
          </div>
        </header>
        <section class="card">
          {!this.entry ? (
            <div class="form-skeleton" aria-busy="true" aria-label="Načítava sa">
              {[1, 2, 3, 4, 5].map(() => (
                <span class="skeleton"></span>
              ))}
            </div>
          ) : (
            <form onFocusout={validateOnBlur}>
              <md-outlined-text-field
                required
                value={this.entry.name}
                oninput={(ev: InputEvent) => {
                  this.entry.name = this.inputValue(ev);
                  this.isValid = this.isFormValid();
                }}
                label="Názov zariadenia"
              >
                <md-icon slot="leading-icon">devices</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                required
                value={this.entry.deviceId}
                oninput={(ev: InputEvent) => {
                  this.entry.deviceId = this.inputValue(ev);
                  this.isValid = this.isFormValid();
                }}
                label="Registračné číslo zariadenia"
              >
                <md-icon slot="leading-icon">pin</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                type="date"
                required
                value={(this.entry.warrantyUntil ? new Date(this.entry.warrantyUntil) : new Date())
                  .toISOString()
                  .substring(0, 10)}
                oninput={(ev: InputEvent) => {
                  const date = new Date(this.inputValue(ev));
                  if (!isNaN(date.getTime())) {
                    this.entry.warrantyUntil = date.toISOString();
                  }
                  this.isValid = this.isFormValid();
                }}
                label="Záruka do"
              >
                <md-icon slot="leading-icon">event</md-icon>
              </md-outlined-text-field>

              <md-outlined-select
                required
                value={this.entry.department?.code}
                oninput={(ev: InputEvent) => {
                  const selectedValue = (ev.target as HTMLSelectElement).value;
                  this.entry.department = {
                    code: selectedValue,
                    name: this.departmentOptions().find(d => d.value === selectedValue)?.name || '',
                  };
                  this.isValid = this.isFormValid();
                }}
                label="Oddelenie"
              >
                <md-icon slot="leading-icon">local_hospital</md-icon>
                {this.departmentOptions().map(department => (
                  <md-select-option value={department.value}>
                    <div slot="headline">{department.name}</div>
                  </md-select-option>
                ))}
              </md-outlined-select>

              <md-outlined-text-field
                required
                value={this.entry.price?.toFixed(2)}
                oninput={(ev: InputEvent) => {
                  const inputValue = parseFloat(this.inputValue(ev));
                  this.entry.price = isNaN(inputValue) ? 0 : parseFloat(inputValue.toFixed(2));
                  this.isValid = this.isFormValid();
                }}
                label="Cena zariadenia"
                type="number"
                min="0.00"
                step="0.01"
                placeholder="0.00"
              >
                <md-icon slot="leading-icon">euro</md-icon>
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
              disabled={!this.entry || this.entryId === '@new' || this.busy}
              onClick={() => (this.confirmDelete = true)}
            >
              <md-icon slot="icon">delete</md-icon>
              Zmazať
            </md-text-button>
            <span class="stretch-fill"></span>
            <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>
              <md-icon slot="icon">close</md-icon>
              Späť
            </md-outlined-button>
            <md-filled-button id="confirm" disabled={!this.isValid || this.busy} onClick={() => this.updateEntry()}>
              <md-icon slot="icon">save</md-icon>
              {this.busy ? 'Ukladá sa…' : 'Uložiť'}
            </md-filled-button>
          </div>
        </section>
        {this.entryId !== '@new' ? (
          <section class="card device-log">
            <h2>
              <md-icon>history</md-icon>
              Prevádzkový log
            </h2>
            {element === 'editor' ? (
              <harkap-ambulance-log-editor
                entry-id={this.entryId}
                log-id={logId}
                api-base={this.apiBase}
                onlog-closed={() => navigate('./entry/' + this.entryId)}
              ></harkap-ambulance-log-editor>
            ) : (
              <div>
                <harkap-ambulance-log-list
                  device-id={this.entryId}
                  api-base={this.apiBase}
                  onlog-clicked={(ev: CustomEvent<string>) => navigate('./entry/' + this.entryId + '/log/' + ev.detail)}
                ></harkap-ambulance-log-list>
              </div>
            )}
          </section>
        ) : null}
        <ConfirmDialog
          open={this.confirmDelete}
          headline="Zmazať zariadenie?"
          text={`${this.entry?.name ? `Zariadenie „${this.entry.name}“` : 'Toto zariadenie'} a jeho záznamy budú natrvalo odstránené.`}
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
    return (
      this.entry?.name &&
      this.entry?.deviceId &&
      this.entry?.warrantyUntil &&
      this.entry?.department?.name &&
      this.entry?.price !== undefined &&
      this.entry?.price >= 0
    );
  }

  private inputValue(ev: InputEvent): string {
    return (ev.target as HTMLInputElement).value;
  }

  private async updateEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const api = AmbulanceDeviceListApiFactory(undefined, this.apiBase);
      const response =
        this.entryId === '@new'
          ? await api.createDeviceListEntry(this.entry)
          : await api.updateDeviceListEntry(this.entryId, this.entry);
      if (response.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.actionError = `Zariadenie sa nepodarilo uložiť: ${response.statusText}`;
      }
    } catch (err: any) {
      this.actionError = `Zariadenie sa nepodarilo uložiť: ${err.message || 'neznáma chyba'}`;
    } finally {
      this.busy = false;
    }
  }

  private async deleteEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).deleteDeviceListEntry(this.entryId);
      if (response.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.actionError = `Zariadenie sa nepodarilo zmazať: ${response.statusText}`;
      }
    } catch (err: any) {
      this.actionError = `Zariadenie sa nepodarilo zmazať: ${err.message || 'neznáma chyba'}`;
    } finally {
      this.busy = false;
    }
  }
}
