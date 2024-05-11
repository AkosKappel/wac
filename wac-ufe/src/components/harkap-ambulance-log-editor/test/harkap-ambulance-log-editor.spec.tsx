import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceLogEditor } from './../harkap-ambulance-log-editor';

describe('harkap-ambulance-log-editor', () => {
  it('renders error message when log cannot be retrieved', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor apiBase="example.com/api" entryId="someEntryId" logId="someLogId" />`,
    });
    page.root.log = undefined;
    page.root.errorMessage = 'Error message';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('renders log form for new log', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor apiBase="example.com/api" entryId="someEntryId" logId="@new" />`,
    });
    page.root.log = { id: '', deviceId: '', createdAt: '', text: '' };
    page.root.errorMessage = '';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('renders log form for existing log', async () => {
    const log = { id: '1', deviceId: 'deviceId', createdAt: '2024-05-01T12:00:00Z', text: 'Log text' };
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor apiBase="example.com/api" entryId="someEntryId" logId="1" />`,
    });
    page.root.log = log;
    page.root.errorMessage = '';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('emits log-closed event with "store" when log is successfully updated or created', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor apiBase="example.com/api" entryId="someEntryId" logId="@new" />`,
    });
    const updateButton = page.root.shadowRoot.querySelector('#confirm') as HTMLButtonElement;
    updateButton.click();
    await page.waitForChanges();
    expect(page.root.logClosed).toHaveReceivedEventDetail('store');
  });

  it('emits log-closed event with "delete" when log is successfully deleted', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor apiBase="example.com/api" entryId="someEntryId" logId="1" />`,
    });
    const deleteButton = page.root.shadowRoot.querySelector('#delete') as HTMLButtonElement;
    deleteButton.click();
    await page.waitForChanges();
    expect(page.root.logClosed).toHaveReceivedEventDetail('delete');
  });
});
