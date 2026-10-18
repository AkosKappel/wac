import { Component, Host, Listen, Prop, State, h } from '@stencil/core';
import { Department, DeviceListEntry } from '../../api/ambulance-wl';
import { apiClients } from '../../utils/api';
import { normalize } from '../../utils/device-query';
import { t } from '../../utils/i18n';
import { activeTheme, settings } from '../../utils/settings';
import { navigateTo } from '../../utils/utils';

interface PaletteOption {
  icon: string;
  label: string;
  detail?: string;
  lang?: string;
  /** a path relative to basePath, or an action */
  target: string | (() => void);
}

const MAX_MATCHES = 8;

/**
 * Ctrl+K / Cmd+K jump list: type to filter the pages and actions, find devices and
 * departments by name or code, or search the device list for what was typed.
 */
@Component({
  tag: 'harkap-ambulance-command-palette',
  styleUrl: 'harkap-ambulance-command-palette.css',
  shadow: true,
})
export class HarkapAmbulanceCommandPalette {
  @Prop() apiBase: string;
  @Prop() basePath: string = '';
  @State() query = '';
  @State() active = 0;
  @State() devices: DeviceListEntry[] = [];
  @State() departments: Department[] = [];

  private dialog: HTMLDialogElement;
  private input: HTMLInputElement;

  @Listen('keydown', { target: 'document' })
  handleShortcut(ev: KeyboardEvent) {
    if (ev.key?.toLowerCase() === 'k' && (ev.ctrlKey || ev.metaKey)) {
      // the browser would otherwise focus its own search box
      ev.preventDefault();
      this.dialog.open ? this.dialog.close() : this.open();
    }
  }

  private open() {
    this.query = '';
    this.active = 0;
    this.dialog.showModal();
    this.input.focus();
    this.load();
  }

  // loaded on every open, so new and deleted devices show up; a failed call keeps the last results
  private async load() {
    const api = apiClients(this.apiBase);
    const [devices, departments] = await Promise.all([
      api.devices.getDeviceListEntries().catch(() => this.devices),
      api.departments.getDepartments().catch(() => this.departments),
    ]);
    this.devices = devices ?? [];
    this.departments = departments ?? [];
  }

  private options(): PaletteOption[] {
    const m = t();
    const query = normalize(this.query);
    const matches = (...texts: string[]) => texts.some(text => normalize(text).includes(query));
    const dark = activeTheme() === 'dark';
    const pages: PaletteOption[] = [
      { icon: 'home', label: m.shell.home, target: './' },
      { icon: 'inventory_2', label: m.shell.devices, target: './devices' },
      { icon: 'add_circle', label: m.list.newDevice, target: './devices/@new' },
      { icon: 'engineering', label: m.shell.maintenance, target: './maintenance' },
      { icon: 'apartment', label: m.shell.departments, target: './departments' },
      { icon: 'info', label: m.shell.about, target: './about' },
      {
        icon: 'translate',
        label: m.shell.switchLanguage,
        lang: m.shell.otherLanguage.toLowerCase(),
        target: () => (settings.state.language = settings.state.language === 'sk' ? 'en' : 'sk'),
      },
      {
        icon: dark ? 'light_mode' : 'dark_mode',
        label: dark ? m.palette.lightTheme : m.palette.darkTheme,
        target: () => (settings.state.theme = dark ? 'light' : 'dark'),
      },
    ].filter(option => matches(option.label));
    if (!query) {
      return pages;
    }

    const devices = this.devices
      .filter(device => matches(device.name, device.deviceId))
      .slice(0, MAX_MATCHES)
      .map(device => ({
        icon: 'medical_services',
        label: device.name,
        detail: [device.deviceId, device.department?.name].filter(Boolean).join(' · '),
        target: './devices/' + device.id,
      }));
    const departments = this.departments
      .filter(department => matches(department.name, department.code))
      .slice(0, MAX_MATCHES)
      .map(department => ({
        icon: 'apartment',
        label: department.name,
        detail: m.palette.departmentDevices,
        target: './devices?department=' + encodeURIComponent(department.code),
      }));
    const typed = this.query.trim();
    const search = {
      icon: 'search',
      label: m.palette.searchDevices(typed),
      target: './devices?q=' + encodeURIComponent(typed),
    };
    return [...pages, ...devices, ...departments, search];
  }

  private activate(option: PaletteOption) {
    this.dialog.close();
    typeof option.target === 'string' ? navigateTo(this.basePath, option.target) : option.target();
  }

  private handleKeyDown(ev: KeyboardEvent, options: PaletteOption[], active: number) {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      const step = ev.key === 'ArrowDown' ? 1 : -1;
      this.active = (active + step + options.length) % options.length;
    } else if (ev.key === 'Enter' && options[active]) {
      ev.preventDefault();
      this.activate(options[active]);
    }
  }

  componentDidRender() {
    if (this.dialog?.open) {
      this.dialog.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }
  }

  render() {
    const m = t().palette;
    const options = this.options();
    // new results can be fewer than before
    const active = Math.min(this.active, options.length - 1);
    return (
      <Host>
        <md-icon-button
          aria-label={m.open}
          title={`${m.open} (Ctrl+K)`}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={() => this.open()}
        >
          <md-icon aria-hidden="true">search</md-icon>
        </md-icon-button>
        <dialog
          aria-label={m.title}
          closedby="any"
          ref={el => (this.dialog = el)}
          // closedby="any" is not in every browser yet: a click outside the content hits the dialog itself
          onClick={ev => ev.target === this.dialog && this.dialog.close()}
        >
          <div class="search">
            <md-icon aria-hidden="true">search</md-icon>
            <input
              ref={el => (this.input = el)}
              type="search"
              autocomplete="off"
              spellcheck={false}
              placeholder={m.placeholder}
              aria-label={m.input}
              role="combobox"
              aria-controls="palette-options"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `palette-option-${active}` : undefined}
              value={this.query}
              onInput={ev => {
                this.query = (ev.target as HTMLInputElement).value;
                this.active = 0;
              }}
              onKeyDown={ev => this.handleKeyDown(ev, options, active)}
            />
          </div>
          <ul id="palette-options" role="listbox" aria-label={m.title}>
            {options.map((option, index) => (
              <li
                id={`palette-option-${index}`}
                role="option"
                aria-selected={String(index === active)}
                lang={option.lang}
                onClick={() => this.activate(option)}
              >
                <md-icon aria-hidden="true">{option.icon}</md-icon>
                <span class="text">
                  {option.label}
                  {option.detail && <span class="detail">{option.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p class="hint">
            <kbd>↑</kbd> <kbd>↓</kbd> {m.move} · <kbd>Enter</kbd> {m.choose} · <kbd>Esc</kbd> {m.close}
          </p>
        </dialog>
      </Host>
    );
  }
}
