import { Component, Host, Prop, State, h } from '@stencil/core';
import { ErrorPage } from '../../utils/error-page';
import { LogoMark } from '../../utils/logo';
import { hrefTo, navigateTo, watchRelativePath } from '../../utils/utils';

declare global {
  interface Window {
    navigation: any;
  }
}

type Page = 'home' | 'devices' | 'device' | 'about' | 'not-found';

const GITHUB_URL = 'https://github.com/AkosKappel/wac';
const PORTFOLIO_URL = 'https://portfolio-taupe-eta-51.vercel.app';

/** Old links (/list, /entry/<id>) point to the device list and detail under /devices. */
export function currentPath(relativePath: string): string {
  return relativePath.replace(/^list\/?$/, 'devices').replace(/^entry\//, 'devices/');
}

export function pageOf(path: string): Page {
  const clean = path.replace(/\/$/, '');
  if (clean === '') return 'home';
  if (clean === 'devices') return 'devices';
  if (/^devices\/[^/]+(\/log\/[^/]+)?$/.test(clean)) return 'device';
  if (clean === 'about') return 'about';
  return 'not-found';
}

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

  connectedCallback() {
    this.unwatch = watchRelativePath(this.basePath, path => {
      const current = currentPath(path);
      if (current !== path) {
        history.replaceState(history.state, '', hrefTo(this.basePath, current) + location.search);
      }
      this.relativePath = current;
    });
  }

  disconnectedCallback() {
    this.unwatch?.();
  }

  render() {
    const page = pageOf(this.relativePath);
    const href = (path: string) => hrefTo(this.basePath, path);
    const navigate = (path: string) => navigateTo(this.basePath, path);
    const navLink = (path: string, target: Page[], label: string) => (
      <a href={href(path)} aria-current={target.includes(page) ? 'page' : undefined}>
        {label}
      </a>
    );

    return (
      <Host>
        <p class="demo-notice">
          <md-icon>info</md-icon>
          Ukážková verzia: údaje sa každú noc o 3:00 obnovia do pôvodného stavu.
        </p>
        <header class="app-header">
          <a class="brand" href={href('./')}>
            <LogoMark />
            <span>Ambulance Devices</span>
          </a>
          <nav class="app-nav" aria-label="Hlavná navigácia">
            {navLink('./', ['home'], 'Domov')}
            {navLink('./devices', ['devices', 'device'], 'Zariadenia')}
            {navLink('./about', ['about'], 'O projekte')}
          </nav>
        </header>
        <main>
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
          ) : page === 'about' ? (
            <harkap-ambulance-about base-path={this.basePath}></harkap-ambulance-about>
          ) : (
            <ErrorPage status={404} onBack={() => navigate('./devices')} />
          )}
        </main>
        <footer class="app-footer">
          <span>© 2026 Ákos Kappel · Webové aplikácie v prostredí cloudu, FIIT STU</span>
          <nav aria-label="Odkazy">
            <a href={href('./about')}>O projekte</a>
            <a href="/api-docs/">API dokumentácia</a>
            <a href={GITHUB_URL} rel="noopener">GitHub</a>
            <a href={PORTFOLIO_URL} rel="noopener">Portfólio</a>
          </nav>
        </footer>
      </Host>
    );
  }
}
