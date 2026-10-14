import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceAbout } from '../harkap-ambulance-about';
import { settings } from '../../../utils/settings';

describe('harkap-ambulance-about', () => {
  it('follows the chosen language', async () => {
    settings.state.language = 'en';
    const page = await newSpecPage({ components: [HarkapAmbulanceAbout], html: `<harkap-ambulance-about></harkap-ambulance-about>` });
    expect(page.root.shadowRoot.querySelector('h2').textContent).toEqual('What the app does');

    settings.state.language = 'sk';
    await page.waitForChanges();
    expect(page.root.shadowRoot.querySelector('h2').textContent).toEqual('Čo aplikácia robí');
  });
});
