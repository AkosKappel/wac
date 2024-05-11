import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceLogEditor } from './../harkap-ambulance-log-editor';
import { DeviceLog } from '../../../api/ambulance-wl';

describe('harkap-ambulance-log-editor', () => {
  const sampleLog: DeviceLog = {
    id: '1',
    deviceId: 'US-001',
    createdAt: new Date().toISOString(),
    text: 'Log text',
  };

  it(`initializes a new log when logId is "@new"`, async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor log-id="@new"></harkap-ambulance-log-editor>`,
    });
    expect(page.rootInstance.isValid).toBeFalsy();
    expect(page.rootInstance.log).toBeDefined();
    expect(page.rootInstance.log.id).toBeTruthy();
    expect(page.rootInstance.log.text).toBe('');
  });

  it(`validates the log form`, async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor></harkap-ambulance-log-editor>`,
    });
    page.rootInstance.log = sampleLog;

    await page.rootInstance.isFormValid();
    expect(page.rootInstance.isFormValid()).toBeTruthy();
  });

  it(`shows an error message if the API call fails`, async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor></harkap-ambulance-log-editor>`,
    });
    page.rootInstance.errorMessage = 'Cannot retrieve log data: Network Error';
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.error').textContent).toContain('Network Error');
  });
});
