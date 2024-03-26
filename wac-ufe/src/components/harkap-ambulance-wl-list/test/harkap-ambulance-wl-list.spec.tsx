import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlList } from '../harkap-ambulance-wl-list';

describe('harkap-ambulance-wl-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
    });

    const wlList = page.rootInstance as HarkapAmbulanceWlList;
    const expectedPatients = wlList?.waitingPatients?.length;

    const items = page.root.shadowRoot.querySelectorAll('md-list-item');
    expect(items.length).toEqual(expectedPatients);
  });
});
