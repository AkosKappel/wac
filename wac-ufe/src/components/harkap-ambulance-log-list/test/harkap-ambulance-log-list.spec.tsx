import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceLogList } from './../harkap-ambulance-log-list';

describe('harkap-ambulance-log-list', () => {
  it('renders error message when device logs cannot be retrieved', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogList],
      html: `<harkap-ambulance-log-list apiBase="example.com/api" device-id="someId" />`,
    });
    page.root.deviceLogs = [];
    page.root.errorMessage = 'Error message';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('renders list of device logs when logs are available', async () => {
    const logs = [
      { id: '1', text: 'Log 1', createdAt: '2024-05-01T12:00:00Z' },
      { id: '2', text: 'Log 2', createdAt: '2024-05-02T12:00:00Z' },
    ];
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogList],
      html: `<harkap-ambulance-log-list apiBase="example.com/api" device-id="someId" />`,
    });
    page.root.deviceLogs = logs;
    page.root.errorMessage = '';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('emits log-clicked event when log item is clicked', async () => {
    const logs = [{ id: '1', text: 'Log 1', createdAt: '2024-05-01T12:00:00Z' }];
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogList],
      html: `<harkap-ambulance-log-list apiBase="example.com/api" device-id="someId" />`,
    });
    page.root.deviceLogs = logs;
    page.root.errorMessage = '';
    await page.waitForChanges();
    const logListItem = page.root.shadowRoot.querySelector('.list-item') as HTMLElement;
    logListItem.click();
    expect(page.root.logClicked).toHaveReceivedEventDetail(logs[0].id);
  });
});
