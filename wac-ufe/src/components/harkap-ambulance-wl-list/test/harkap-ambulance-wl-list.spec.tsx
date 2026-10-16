import { newSpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapAmbulanceWlList } from './../harkap-ambulance-wl-list';
import { DeviceListEntry } from '../../../api/ambulance-wl';

const respondWith = (body: any, status = 200) =>
  (global.fetch = jest.fn().mockResolvedValue(new MockResponse(JSON.stringify(body), { status })) as any);

describe('harkap-ambulance-wl-list', () => {
  const sampleDevices: DeviceListEntry[] = [
    {
      id: '1',
      name: 'Defibrillator',
      department: { name: 'Cardiology', code: 'kar' },
      deviceId: '1',
      warrantyUntil: '2030-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Ultrasound',
      department: { name: 'Radiology', code: 'rad' },
      deviceId: '2',
      warrantyUntil: '2030-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => respondWith(sampleDevices));

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
    page.rootInstance.query = { ...page.rootInstance.query, q: 'defib' };

    expect(page.rootInstance.filteredDevices()).toEqual([
      {
        id: '1',
        name: 'Defibrillator',
        department: { name: 'Cardiology', code: 'kar' },
        deviceId: '1',
        warrantyUntil: '2030-01-01T00:00:00Z',
      },
    ]);
  });

  it('shows the empty state when the API returns null', async () => {
    respondWith(null);
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
      supportsShadowDom: true,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(page.rootInstance.devices).toEqual([]);
    expect(page.root.shadowRoot.querySelector('.empty')).not.toBeNull();
  });
});
