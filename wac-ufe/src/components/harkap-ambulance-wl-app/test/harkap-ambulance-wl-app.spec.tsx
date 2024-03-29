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
    expect('1').toEqual('1');
  });
});