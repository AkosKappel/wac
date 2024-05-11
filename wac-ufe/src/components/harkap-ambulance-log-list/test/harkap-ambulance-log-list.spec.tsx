import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceLogList } from './../harkap-ambulance-log-list';
import { DeviceLog } from '../../../api/ambulance-wl';

describe('harkap-ambulance-log-list', () => {
  const sampleLogs: DeviceLog[] = [
    {
      id: '1',
      deviceId: 'US-001',
      createdAt: new Date().toISOString(),
      text: 'Log text',
    },
    {
      id: '2',
      deviceId: 'US-001',
      createdAt: new Date().toISOString(),
      text: 'Log text',
    },
  ];

  it(`displays logs when data is loaded`, async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogList],
      html: `<harkap-ambulance-log-list></harkap-ambulance-log-list>`,
      supportsShadowDom: true,
    });
    const logList = page.rootInstance as HarkapAmbulanceLogList;
    logList.deviceLogs = sampleLogs;
    await page.waitForChanges();

    const items = page.rootInstance.filteredLogs();
    expect(items.length).toBe(sampleLogs.length);
  });

  it(`shows an error message if the API call fails`, async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogList],
      html: `<harkap-ambulance-log-list></harkap-ambulance-log-list>`,
    });
    page.rootInstance.errorMessage = 'Cannot retrieve list of logs: Network Error';
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.error').textContent).toContain('Network Error');
  });
});
