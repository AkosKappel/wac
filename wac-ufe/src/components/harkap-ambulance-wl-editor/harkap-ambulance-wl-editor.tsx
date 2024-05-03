import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { AmbulanceDeviceListApiFactory, DeviceListEntry } from '../../api/ambulance-wl';

@Component({
  tag: 'harkap-ambulance-wl-editor',
  styleUrl: 'harkap-ambulance-wl-editor.css',
  shadow: true,
})
export class HarkapAmbulanceWlEditor {
  @State() private relativePath = '';
  @Prop() entryId: string;
  @Prop() basePath: string = '';
  @Prop() apiBase: string;
  @State() entry: DeviceListEntry;
  @State() errorMessage: string;
  @State() isValid: boolean;

  private departments = [
    { value: 'chir', name: 'Chirurgia' },
    { value: 'gyn', name: 'Gynekológia' },
    { value: 'dets', name: 'Detské' },
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
        this.errorMessage = `Cannot retrieve list of devices: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of devices: ${err.message || 'unknown'}`;
    }

    return undefined;
  }

  async componentWillLoad() {
    this.getDeviceEntryAsync();

    const baseUri = new URL(this.basePath, document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      if (path.startsWith(baseUri)) {
        this.relativePath = path.slice(baseUri.length);
      } else {
        this.relativePath = '';
      }
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      let path = new URL((ev as any).destination.url).pathname;
      toRelative(path);
    });

    toRelative(location.pathname);
  }

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  render() {
    let element = 'list';
    let logId = '@new';

    if (this.relativePath.includes('log/')) {
      element = 'editor';
      logId = this.relativePath.split('/')[3];
    }

    const navigate = (path: string) => {
      const absolute = new URL(path, new URL(this.basePath, document.baseURI)).pathname;
      window.navigation.navigate(absolute);
    };

    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    return (
      <Host>
        {this.entryId !== '@new' ? (
          <h2>
            Zariadenie {this.entry?.name} - {this.entry?.deviceId}
          </h2>
        ) : (
          <h2>Nové zariadenie</h2>
        )}
        <form>
          <md-filled-text-field
            required
            value={this.entry?.name}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.name = this.handleInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="Názov zariadenia"
          >
            <md-icon slot="leading-icon">devices</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            required
            value={this.entry?.deviceId}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.deviceId = this.handleInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="Registračné číslo zariadenia"
          >
            <md-icon slot="leading-icon">pin</md-icon>
          </md-filled-text-field>

          <md-filled-text-field
            type="date"
            required
            value={(this.entry?.warrantyUntil ? new Date(this.entry?.warrantyUntil) : new Date())
              .toISOString()
              .substring(0, 10)}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.warrantyUntil = this.handleDateInputEvent(ev);
                this.isValid = this.isFormValid();
              }
            }}
            label="Záruka do"
          >
            <md-icon slot="leading-icon">event</md-icon>
          </md-filled-text-field>

          <md-filled-select
            required
            value={this.entry?.department?.name}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.department.code = this.handleInputEvent(ev);
                this.entry.department.name = this.departments.find(d => d.value === this.entry.department.code).name;
                this.isValid = this.isFormValid();
              }
            }}
            label="Oddelenie"
          >
            <md-icon slot="leading-icon">local_hospital</md-icon>
            {this.departments.map(department => (
              <md-select-option value={department.value}>
                <div slot="headline">{department.name}</div>
              </md-select-option>
            ))}
          </md-filled-select>

          <md-filled-text-field
            required
            value={this.entry?.price?.toString()}
            oninput={(ev: InputEvent) => {
              if (this.entry) {
                this.entry.price = parseFloat(this.handleInputEvent(ev));
                this.isValid = this.isFormValid();
              }
            }}
            label="Cena zariadenia"
            type="number"
            min="0.00"
            step="0.01"
            placeholder="0.00"
          >
            <md-icon slot="leading-icon">euro</md-icon>
          </md-filled-text-field>
        </form>

        <md-divider></md-divider>
        <div class="actions">
          <md-filled-tonal-button
            id="delete"
            disabled={!this.entry || this.entry?.id === '@new'}
            onClick={() => this.deleteEntry()}
          >
            <md-icon slot="icon">delete</md-icon>
            Zmazať
          </md-filled-tonal-button>
          <span class="stretch-fill"></span>
          <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>
            <md-icon slot="icon">close</md-icon>
            Zrušiť
          </md-outlined-button>
          <md-filled-button id="confirm" disabled={!this.isValid} onClick={() => this.updateEntry()}>
            <md-icon slot="icon">save</md-icon>
            Uložiť
          </md-filled-button>
        </div>
        {this.entryId !== '@new' ? (
          <div class="device-log">
            <h2>Prevádzkový log zariadenia {this.entry?.name || '...'}</h2>
            {element === 'editor' ? (
              <harkap-ambulance-log-editor
                entry-id={this.entryId}
                log-id={logId}
                base-path="/ambulance-wl/"
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
          </div>
        ) : null}
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
      const api = AmbulanceDeviceListApiFactory(undefined, this.apiBase);
      const response =
        this.entryId === '@new'
          ? await api.createDeviceListEntry(this.entry)
          : await api.updateDeviceListEntry(this.entryId, this.entry);
      if (response.status < 299) {
        this.editorClosed.emit('store');
      } else {
        this.errorMessage = `Cannot store entry: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot store entry: ${err.message || 'unknown'}`;
    }
  }

  private async deleteEntry() {
    try {
      const response = await AmbulanceDeviceListApiFactory(undefined, this.apiBase).deleteDeviceListEntry(this.entryId);
      if (response.status < 299) {
        this.editorClosed.emit('delete');
      } else {
        this.errorMessage = `Cannot delete entry: ${response.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Cannot delete entry: ${err.message || 'unknown'}`;
    }
  }
}
