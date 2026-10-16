import { Component, Host, Prop, State, h } from '@stencil/core';
import { ErrorPage } from '../../utils/error-page';
import { t } from '../../utils/i18n';
import { GITHUB_URL, PORTFOLIO_URL } from '../../utils/links';
import { LogoMark } from '../../utils/logo';
import { Page, currentPath, pageOf } from '../../utils/routes';
import { activeTheme, nextTheme, settings } from '../../utils/settings';
import { hrefTo, navigateTo, pageKey, watchRelativePath } from '../../utils/utils';

declare global {
  interface Window {
    navigation: any;
  }
}

const THEME_ICONS = { system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' };

@Component({
  tag: 'harkap-ambulance-wl-app',
  styleUrls: ['harkap-ambulance-wl-app.css', '../../utils/shared.css'],
  shadow: true,
})
export class HarkapAmbulanceWlApp {
  @State() private relativePath = '';
  @Prop() basePath: string = '';
  @Prop() apiBase: string;

  private unwatch: () => void;
  private main: HTMLElement;
  private moveFocus = false;

  connectedCallback() {
    let first = true;
    this.unwatch = watchRelativePath(this.basePath, path => {
      const current = currentPath(path);
      if (current !== path) {
        history.replaceState(history.state, '', hrefTo(this.basePath, current) + location.search);
      }
      // filters change only the query and the log editor opens inside the device page:
      // neither may move focus away from where the user is
      this.moveFocus = !first && pageKey(current) !== pageKey(this.relativePath);
      first = false;
      this.relativePath = current;
    });
  }

  componentDidRender() {
    const page = pageOf(this.relativePath);
    const m = t().shell;
    const titles: Record<Page, string | undefined> = {
      'home': undefined,
      'devices': m.devices,
      'device': m.devices,
      'maintenance': m.maintenance,
      'departments': m.departments,
      'about': m.about,
      'not-found': t().errors.notFoundTitle,
    };
    document.title = [titles[page], 'Ambulance Devices'].filter(Boolean).join(' · ');
    // screen readers start reading the new page, keyboard users tab on from its top
    if (this.moveFocus) {
      this.moveFocus = false;
      // the router already scrolled the new page to the top; focusing must not scroll past the header
      this.main?.focus({ preventScroll: true });
    }
  }

  disconnectedCallback() {
    this.unwatch?.();
  }

  render() {
    const page = pageOf(this.relativePath);
    const href = (path: string) => hrefTo(this.basePath, path);
    const navigate = (path: string) => navigateTo(this.basePath, path);
    const m = t().shell;
    const navLink = (path: string, target: Page[], label: string) => (
      <a href={href(path)} aria-current={target.includes(page) ? 'page' : undefined}>
        {label}
      </a>
    );

    return (
      <Host data-theme={activeTheme()}>
        <aside class="demo-notice">
          <md-icon aria-hidden="true">info</md-icon>
          {m.demoNotice}
        </aside>
        <header class="app-header">
          <a class="brand" href={href('./')}>
            <LogoMark />
            <span>Ambulance Devices</span>
          </a>
          <nav class="app-nav" aria-label={m.mainNav}>
            {navLink('./', ['home'], m.home)}
            {navLink('./devices', ['devices', 'device'], m.devices)}
            {navLink('./maintenance', ['maintenance'], m.maintenance)}
            {navLink('./departments', ['departments'], m.departments)}
            {navLink('./about', ['about'], m.about)}
          </nav>
          <div class="header-actions">
            <md-text-button
              class="language"
              lang={m.otherLanguage.toLowerCase()}
              aria-label={`${m.otherLanguage}, ${m.switchLanguage}`}
              title={m.switchLanguage}
              onClick={() => (settings.state.language = settings.state.language === 'sk' ? 'en' : 'sk')}
            >
              <md-icon slot="icon">translate</md-icon>
              {m.otherLanguage}
            </md-text-button>
            <md-icon-button
              aria-label={m.theme[settings.state.theme]}
              title={m.theme[settings.state.theme]}
              onClick={() => (settings.state.theme = nextTheme(settings.state.theme))}
            >
              <md-icon aria-hidden="true">{THEME_ICONS[settings.state.theme]}</md-icon>
            </md-icon-button>
          </div>
        </header>
        <main tabindex="-1" ref={el => (this.main = el)}>
          {page === 'home' ? (
            <harkap-ambulance-home api-base={this.apiBase} base-path={this.basePath}></harkap-ambulance-home>
          ) : page === 'devices' ? (
            <harkap-ambulance-wl-list
              api-base={this.apiBase}
              onentry-clicked={(ev: CustomEvent<string>) => navigate('./devices/' + ev.detail)}
            ></harkap-ambulance-wl-list>
          ) : page === 'device' ? (
            <harkap-ambulance-wl-editor
              entry-id={this.relativePath.split('/')[1]}
              base-path={this.basePath}
              api-base={this.apiBase}
              oneditor-closed={() => navigate('./devices')}
            ></harkap-ambulance-wl-editor>
          ) : page === 'maintenance' ? (
            <harkap-ambulance-maintenance
              api-base={this.apiBase}
              base-path={this.basePath}
            ></harkap-ambulance-maintenance>
          ) : page === 'departments' ? (
            <harkap-ambulance-departments
              api-base={this.apiBase}
              base-path={this.basePath}
            ></harkap-ambulance-departments>
          ) : page === 'about' ? (
            <harkap-ambulance-about></harkap-ambulance-about>
          ) : (
            <ErrorPage status={404} onBack={() => navigate('./devices')} />
          )}
        </main>
        <footer class="app-footer">
          <span>© 2026 Ákos Kappel · {m.course}</span>
          <nav aria-label={m.footerLinks}>
            <a href={href('./about')}>{m.about}</a>
            <a href="/api-docs/">{m.apiDocs}</a>
            <a href={GITHUB_URL} rel="noopener">
              GitHub
            </a>
            <a href={PORTFOLIO_URL} rel="noopener">
              {m.portfolio}
            </a>
          </nav>
        </footer>
      </Host>
    );
  }
}
