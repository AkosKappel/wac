import { newSpecPage } from '@stencil/core/testing';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { HarkapAmbulanceHome } from '../harkap-ambulance-home';

describe('harkap-ambulance-home', () => {
  let mock: MockAdapter;
  beforeEach(() => (mock = new MockAdapter(axios)));
  afterEach(() => mock.restore());

  it('shows the overview of the loaded devices', async () => {
    mock.onGet().reply(200, [
      { id: '1', name: 'CT', deviceId: '1', price: 900, warrantyUntil: '2000-01-01T00:00:00Z', department: { code: 'rad', name: 'Radiology' } },
      { id: '2', name: 'MRI', deviceId: '2', price: 100, warrantyUntil: '2100-01-01T00:00:00Z', department: { code: 'rad', name: 'Radiology' } },
    ]);
    const page = await newSpecPage({
      components: [HarkapAmbulanceHome],
      html: `<harkap-ambulance-home base-path="/"></harkap-ambulance-home>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    const values = Array.from(page.root.shadowRoot.querySelectorAll('.stat-value')).map(el => el.textContent);
    expect(values[0]).toEqual('2');
    expect(values[3]).toEqual('1');
    const department = page.root.shadowRoot.querySelector('.departments a');
    expect(department.getAttribute('href')).toEqual('/devices?department=rad');
  });

  it('keeps the page when the API fails', async () => {
    mock.onGet().networkError();
    const page = await newSpecPage({
      components: [HarkapAmbulanceHome],
      html: `<harkap-ambulance-home></harkap-ambulance-home>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.load-failed')).not.toBeNull();
    expect(page.root.shadowRoot.querySelector('h1')).not.toBeNull();
  });
});
