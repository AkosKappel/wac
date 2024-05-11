import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlEditor } from './../harkap-ambulance-wl-editor';
import { DeviceListEntry } from '../../../api/ambulance-wl';

describe('harkap-ambulance-wl-editor', () => {
  const sampleEntry: DeviceListEntry = {
    id: '1',
    name: 'Ultrasound',
    deviceId: 'US-001',
    warrantyUntil: new Date().toISOString(),
    department: { name: 'Radiology' },
    price: 5000,
  };

  it('initializes a new entry when entryId is "@new"', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlEditor],
      html: `<harkap-ambulance-wl-editor entry-id="@new"></harkap-ambulance-wl-editor>`,
    });
    expect(page.rootInstance.isValid).toBeFalsy();
    expect(page.rootInstance.entry).toBeDefined();
    expect(page.rootInstance.entry.id).toBeTruthy();
    expect(page.rootInstance.entry.name).toBe('');
  });

  it('validates the entry form', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlEditor],
      html: `<harkap-ambulance-wl-editor entry-id="@new"></harkap-ambulance-wl-editor>`,
    });
    page.rootInstance.entry = sampleEntry;

    await page.rootInstance.isFormValid();
    expect(page.rootInstance.isFormValid()).toBeTruthy();
  });
});
