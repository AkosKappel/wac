import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlList } from './../harkap-ambulance-wl-list';

describe('harkap-ambulance-wl-list', () => {
  it('render', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
    });

    const wlList = page.rootInstance as HarkapAmbulanceWlList;
    const expectedPatients = wlList?.devices?.length

    const items = page.root.shadowRoot.querySelectorAll("md-list-item");
    expect(items.length).toEqual(expectedPatients);
  });

  it('displays error message if errorMessage is set', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list error-message="Test error message"></harkap-ambulance-wl-list>`,
    });
    const errorElement = page.root.querySelector('.error');
    expect(errorElement).not.toBeNull();
    expect(errorElement.textContent).toContain('Test error message');
  });

  it('displays devices list', async () => {
    const devices = [
      { id: '1', name: 'Device 1', department: { name: 'Department 1' } },
      { id: '2', name: 'Device 2', department: { name: 'Department 2' } },
    ];
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
      supportsShadowDom: true,
    });
    page.rootInstance.devices = devices;
    await page.waitForChanges();

    const listItems = page.root.querySelectorAll('.list-item');
    expect(listItems.length).toBe(2);

    const firstItem = listItems[0];
    expect(firstItem.querySelector('[slot="headline"]').textContent).toBe('Device 1');
    expect(firstItem.querySelector('[slot="supporting-text"]').textContent).toContain('Department 1');
  });
});
