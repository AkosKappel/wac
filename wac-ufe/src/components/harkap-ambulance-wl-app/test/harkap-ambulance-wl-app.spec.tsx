import { newSpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapAmbulanceWlApp } from './../harkap-ambulance-wl-app';
import { currentPath, pageOf } from '../../../utils/routes';

describe('harkap-ambulance-wl-app', () => {
  const render = (url: string, basePath = '/') =>
    newSpecPage({
      url,
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app base-path="${basePath}"></harkap-ambulance-wl-app>`,
    });

  it('renders the homepage at the base path', async () => {
    const page = await render('http://localhost/ambulance-wl/', '/ambulance-wl/');
    expect(page.root.shadowRoot.querySelector('harkap-ambulance-home')).not.toBeNull();
  });

  it('renders the device list', async () => {
    const page = await render('http://localhost/devices');
    expect(page.root.shadowRoot.querySelector('harkap-ambulance-wl-list')).not.toBeNull();
  });

  it('renders the editor for an old /entry link', async () => {
    const page = await render('http://localhost/entry/@new');
    expect(page.root.shadowRoot.querySelector('harkap-ambulance-wl-editor').getAttribute('entry-id')).toEqual('@new');
  });

  it('marks the current page in the navigation', async () => {
    const page = await render('http://localhost/about');
    expect(page.root.shadowRoot.querySelector('.app-nav [aria-current="page"]').getAttribute('href')).toEqual('/about');
  });

  it('shows how many devices are due for service on the navigation', async () => {
    const due = [{ overdue: true }, { overdue: false }, { overdue: false }];
    global.fetch = jest.fn().mockResolvedValue(new MockResponse(JSON.stringify(due))) as any;
    const page = await render('http://localhost/devices');
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/maintenance/due?days=30');
    const link = page.root.shadowRoot.querySelector('.app-nav a[href="/maintenance"]');
    expect(link.querySelector('.nav-badge').textContent).toBe('3');
    expect(link.querySelector('.nav-badge').classList.contains('overdue')).toBe(true);
    expect(link.querySelector('.visually-hidden').textContent).toContain('1 of them overdue');
  });
});

describe('routes', () => {
  it('maps old links to /devices', () => {
    expect(currentPath('list')).toEqual('devices');
    expect(currentPath('list/')).toEqual('devices');
    expect(currentPath('entry/ct-01/log/ct-01-2')).toEqual('devices/ct-01/log/ct-01-2');
    expect(currentPath('about')).toEqual('about');
  });

  it('finds the page for a path', () => {
    expect(pageOf('')).toEqual('home');
    expect(pageOf('devices/')).toEqual('devices');
    expect(pageOf('devices/ct-01')).toEqual('device');
    expect(pageOf('devices/ct-01/log/@new')).toEqual('device');
    expect(pageOf('about')).toEqual('about');
    expect(pageOf('devices/ct-01/other')).toEqual('not-found');
    expect(pageOf('missing')).toEqual('not-found');
  });
});
