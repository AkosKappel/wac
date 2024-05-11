import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlList } from './../harkap-ambulance-wl-list';
import { DeviceListEntry } from '../../../api/ambulance-wl';

describe('harkap-ambulance-wl-list', () => {
  const sampleDevices: DeviceListEntry[] = [
    { id: '1', name: 'Defibrillator', department: { name: 'Cardiology' }, deviceId: '1' },
    { id: '2', name: 'Ultrasound', department: { name: 'Radiology' }, deviceId: '2' },
  ];

  it('displays devices when data is loaded', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
      supportsShadowDom: true,
    });
    const deviceList = page.rootInstance as HarkapAmbulanceWlList;
    deviceList.devices = sampleDevices;
    await page.rootInstance.filteredDevices();

    const items = page.rootInstance.filteredDevices();
    expect(items.length).toBe(sampleDevices.length);
  });

  it('shows an error message if the API call fails', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
    });
    page.rootInstance.errorMessage = 'Cannot retrieve list of devices: Network Error';
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.error').textContent).toBe(
      'Cannot retrieve list of devices: Network Error',
    );
  });

  it('filters devices based on search text', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
      supportsShadowDom: true,
    });
    page.rootInstance.devices = sampleDevices;
    page.rootInstance.searchText = 'defib';
    await page.rootInstance.filteredDevices();

    expect(page.rootInstance.filteredDevices()).toEqual([
      { id: '1', name: 'Defibrillator', department: { name: 'Cardiology' }, deviceId: '1' },
    ]);
  });
});
