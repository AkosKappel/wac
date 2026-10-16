import { Component, Host, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import { Department, DeviceListEntry } from '../../api/ambulance-wl';
import { apiClients, apiError } from '../../utils/api';
import { ErrorPage } from '../../utils/error-page';
import { ConfirmDialog } from '../../utils/confirm-dialog';
import { ServiceBadge, WarrantyBadge } from '../../utils/warranty-badge';
import { formatDate, formatDateTime, t } from '../../utils/i18n';
import { nextService } from '../../utils/service';
import { hrefTo, navigateTo, watchRelativePath, validateOnBlur } from '../../utils/utils';

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
  /** QR code of the device page for the printed label, as SVG markup */
  @State() qrSvg: string;

  private unwatch: () => void;
  private logHeading: HTMLElement;
  private logOpen = false;

  @State() departments: Department[] = [];

  private async getDeviceEntryAsync(): Promise<DeviceListEntry> {
    if (this.entryId === '@new') {
      this.isValid = false;

      const uniqueId = () => Math.random().toString(36).substr(2, 9);

      this.entry = {
        id: uniqueId(),
        name: '',
        deviceId: '',
        warrantyUntil: new Date().toISOString(),
        department: { name: '', code: '' },
        price: 0,
      };

      return this.entry;
    }

    if (!this.entryId) {
      this.isValid = false;
      return undefined;
    }

    try {
      this.entry = await apiClients(this.apiBase).devices.getDeviceListEntry({ entryId: this.entryId });
      this.isValid = true;
      this.makeQrCode();
    } catch (err) {
      const { status, message } = await apiError(err);
      this.errorStatus = status;
      this.errorMessage = `${t().editor.loadFailed}: ${message}`;
    }

    return undefined;
  }

  // loaded on demand: only the device page needs the encoder
  private async makeQrCode() {
    const { default: qrcode } = await import('qrcode-generator');
    const qr = qrcode(0, 'M');
    qr.addData(location.origin + hrefTo(this.basePath, './devices/' + encodeURIComponent(this.entryId)));
    qr.make();
    this.qrSvg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  componentWillLoad() {
    this.getDeviceEntryAsync();
    this.getDepartmentsAsync();
  }

  // without the list the select still offers the entry's own department
  private async getDepartmentsAsync() {
    try {
      this.departments = (await apiClients(this.apiBase).departments.getDepartments()) ?? [];
    } catch {
      this.departments = [];
    }
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
    return current?.code && !this.departments.some(d => d.code === current.code)
      ? [...this.departments, current]
      : this.departments;
  }

  componentDidRender() {
    // opening or closing a log entry swaps the focused element out of the page
    const logOpen = this.relativePath.includes('log/');
    if (logOpen !== this.logOpen) {
      this.logOpen = logOpen;
      this.logHeading?.focus();
    }
  }

  render() {
    let element = 'list';
    let logId = '@new';

    if (this.relativePath.includes('log/')) {
      element = 'editor';
      logId = this.relativePath.split('/')[3];
    }

    const navigate = (path: string) => navigateTo(this.basePath, path);
    const m = t().editor;
    const common = t().common;

    if (this.errorMessage) {
      return (
        <Host>
          <ErrorPage
            status={this.errorStatus}
            message={this.errorMessage}
            onBack={() => this.editorClosed.emit('cancel')}
          />
        </Host>
      );
    }

    return (
      <Host>
        <header class="page-header">
          <md-icon-button aria-label={m.backToList} onClick={() => this.editorClosed.emit('cancel')}>
            <md-icon aria-hidden="true">arrow_back</md-icon>
          </md-icon-button>
          <div>
            <p class="eyebrow">{this.entryId === '@new' ? m.eyebrowNew : m.eyebrowDetail}</p>
            <h1>{this.entryId === '@new' ? m.titleNew : this.entry?.name || '…'}</h1>
          </div>
          {this.entryId !== '@new' && this.entry && (
            <div class="header-badges">
              <ServiceBadge device={this.entry} />
              {this.entry.warrantyUntil && <WarrantyBadge until={this.entry.warrantyUntil} />}
              <md-icon-button aria-label={m.printLabel} title={m.printLabel} onClick={() => window.print()}>
                <md-icon aria-hidden="true">print</md-icon>
              </md-icon-button>
            </div>
          )}
        </header>
        <section class="card">
          {!this.entry ? (
            <div class="form-skeleton" aria-busy="true" aria-label={common.loading}>
              {[1, 2, 3, 4, 5].map(() => (
                <span class="skeleton"></span>
              ))}
            </div>
          ) : (
            <form onFocusout={validateOnBlur}>
              <md-outlined-text-field
                required
                maxLength={100}
                value={this.entry.name}
                oninput={(ev: InputEvent) => {
                  this.entry.name = this.inputValue(ev);
                  this.isValid = this.isFormValid();
                }}
                label={m.name}
              >
                <md-icon slot="leading-icon">devices</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                required
                maxLength={50}
                value={this.entry.deviceId}
                oninput={(ev: InputEvent) => {
                  this.entry.deviceId = this.inputValue(ev);
                  this.isValid = this.isFormValid();
                }}
                label={m.deviceId}
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
                label={m.warrantyUntil}
              >
                <md-icon slot="leading-icon">event</md-icon>
              </md-outlined-text-field>

              {/* a new select once the departments arrive: Material Web ignores a value set before its options */}
              <md-outlined-select
                key={`departments-${this.departments.length}`}
                required
                value={this.entry.department?.code}
                oninput={(ev: InputEvent) => {
                  const selectedValue = (ev.target as HTMLSelectElement).value;
                  this.entry.department = {
                    code: selectedValue,
                    name: this.departmentOptions().find(d => d.code === selectedValue)?.name || '',
                  };
                  this.isValid = this.isFormValid();
                }}
                label={m.department}
              >
                <md-icon slot="leading-icon">local_hospital</md-icon>
                {this.departmentOptions().map(department => (
                  <md-select-option value={department.code}>
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
                label={m.price}
                type="number"
                min="0.00"
                max="100000000"
                step="0.01"
                placeholder="0.00"
              >
                <md-icon slot="leading-icon">euro</md-icon>
              </md-outlined-text-field>

              <md-outlined-text-field
                type="number"
                min="1"
                max="3650"
                step="1"
                value={this.entry.serviceIntervalDays?.toString() ?? ''}
                oninput={(ev: InputEvent) => {
                  const days = parseInt(this.inputValue(ev), 10);
                  this.entry.serviceIntervalDays = isNaN(days) ? undefined : days;
                  this.isValid = this.isFormValid();
                }}
                label={m.serviceInterval}
                supportingText={m.serviceIntervalHint}
              >
                <md-icon slot="leading-icon">event_repeat</md-icon>
              </md-outlined-text-field>
            </form>
          )}

          {this.entry?.serviceIntervalDays > 0 && this.entryId !== '@new' && this.serviceInfo()}

          {this.actionError && (
            <div class="banner" role="alert">
              <md-icon aria-hidden="true">error</md-icon>
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
              {common.delete}
            </md-text-button>
            <span class="stretch-fill"></span>
            <md-outlined-button id="cancel" onClick={() => this.editorClosed.emit('cancel')}>
              <md-icon slot="icon">close</md-icon>
              {common.back}
            </md-outlined-button>
            <md-filled-button id="confirm" disabled={!this.isValid || this.busy} onClick={() => this.updateEntry()}>
              <md-icon slot="icon">save</md-icon>
              {this.busy ? common.saving : common.save}
            </md-filled-button>
          </div>
        </section>
        {this.entryId !== '@new' && this.entry && this.historyCard()}
        {this.entryId !== '@new' ? (
          <section class="card device-log">
            <h2 tabindex="-1" ref={el => (this.logHeading = el)}>
              <md-icon aria-hidden="true">history</md-icon>
              {m.log}
            </h2>
            {element === 'editor' ? (
              <harkap-ambulance-log-editor
                entry-id={this.entryId}
                log-id={logId}
                api-base={this.apiBase}
                onlog-closed={() => navigate('./devices/' + this.entryId)}
              ></harkap-ambulance-log-editor>
            ) : (
              <div>
                <harkap-ambulance-log-list
                  device-id={this.entryId}
                  api-base={this.apiBase}
                  onlog-clicked={(ev: CustomEvent<string>) =>
                    navigate('./devices/' + this.entryId + '/log/' + ev.detail)
                  }
                ></harkap-ambulance-log-list>
              </div>
            )}
          </section>
        ) : null}
        {this.entry && this.qrSvg && this.printLabel()}
        <ConfirmDialog
          open={this.confirmDelete}
          headline={m.deleteTitle}
          text={m.deleteText(this.entry?.name)}
          onCancel={() => (this.confirmDelete = false)}
          onConfirm={() => {
            this.confirmDelete = false;
            this.deleteEntry();
          }}
        />
      </Host>
    );
  }

  private serviceInfo() {
    const m = t().editor;
    const next = nextService(this.entry);
    return (
      <dl class="service-info">
        <div>
          <dt>{m.lastService}</dt>
          <dd>{this.entry.lastServiceAt ? formatDate(this.entry.lastServiceAt) : m.neverServiced}</dd>
        </div>
        <div>
          <dt>{m.nextService}</dt>
          <dd>{next?.date ? formatDate(next.date) : t().service.overdue}</dd>
        </div>
      </dl>
    );
  }

  private historyCard() {
    const m = t().editor;
    const history = [...(this.entry.history ?? [])].reverse();
    return (
      <section class="card history">
        <h2>
          <md-icon aria-hidden="true">manage_history</md-icon>
          {m.history}
        </h2>
        {history.length === 0 ? (
          <p class="hint">{m.historyEmpty}</p>
        ) : (
          <ol>
            {history.map(record => (
              <li>
                <time dateTime={record.changedAt}>{formatDateTime(record.changedAt)}</time>
                <ul>
                  {record.changes.map(change => (
                    <li>
                      <strong>{m.fields[change.field] ?? change.field}:</strong> {change.from || '–'} →{' '}
                      {change.to || '–'}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>
    );
  }

  /** Only shown when printing: a label to stick on the device. */
  private printLabel() {
    return (
      <section class="print-label" aria-hidden="true">
        <div class="qr" innerHTML={this.qrSvg}></div>
        <div>
          <p class="label-name">{this.entry.name}</p>
          <p class="label-id">{this.entry.deviceId}</p>
          <p>{this.entry.department?.name}</p>
          <p class="label-hint">{t().editor.labelScan}</p>
        </div>
      </section>
    );
  }

  private isFormValid(): boolean {
    const days = this.entry?.serviceIntervalDays;
    return (
      this.entry?.name &&
      this.entry?.deviceId &&
      this.entry?.warrantyUntil &&
      this.entry?.department?.code &&
      this.entry?.price !== undefined &&
      this.entry?.price >= 0 &&
      this.entry?.price <= 100_000_000 &&
      (days === undefined || (days >= 1 && days <= 3650))
    );
  }

  private inputValue(ev: InputEvent): string {
    return (ev.target as HTMLInputElement).value;
  }

  private async updateEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      const devices = apiClients(this.apiBase).devices;
      if (this.entryId === '@new') {
        await devices.createDeviceListEntry({ deviceListEntry: this.entry });
      } else {
        await devices.updateDeviceListEntry({ entryId: this.entryId, deviceListEntry: this.entry });
      }
      this.editorClosed.emit('store');
    } catch (err) {
      this.actionError = `${t().editor.saveFailed}: ${(await apiError(err)).message}`;
    } finally {
      this.busy = false;
    }
  }

  private async deleteEntry() {
    this.busy = true;
    this.actionError = undefined;
    try {
      await apiClients(this.apiBase).devices.deleteDeviceListEntry({ entryId: this.entryId });
      this.editorClosed.emit('delete');
    } catch (err) {
      this.actionError = `${t().editor.deleteFailed}: ${(await apiError(err)).message}`;
    } finally {
      this.busy = false;
    }
  }
}
