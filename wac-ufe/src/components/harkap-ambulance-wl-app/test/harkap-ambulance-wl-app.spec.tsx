import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlApp } from '../harkap-ambulance-wl-app';

describe('harkap-ambulance-wl-app', () => {
  it('renders editor', async () => {
    const page = await newSpecPage({
      url: `http://localhost/entry/@new`,
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app base-path="/"></harkap-ambulance-wl-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual('harkap-ambulance-wl-editor');
  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/ambulance-wl/`,
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app base-path="/ambulance-wl/"></harkap-ambulance-wl-app>`,
    });
    page.win.navigation = new EventTarget();
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual('harkap-ambulance-wl-list');
  });
});
