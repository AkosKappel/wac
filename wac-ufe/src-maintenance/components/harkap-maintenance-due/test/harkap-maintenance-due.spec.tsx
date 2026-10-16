import { newSpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapMaintenanceDue } from '../harkap-maintenance-due';

describe('harkap-maintenance-due', () => {
  const items = [
    {
      id: 'ct-01',
      name: 'CT',
      deviceId: 'RAD-1',
      serviceIntervalDays: 365,
      nextServiceAt: '2020-01-01T00:00:00Z',
      overdue: true,
    },
    {
      id: 'ekg 2',
      name: 'EKG',
      deviceId: 'KAR-2',
      serviceIntervalDays: 180,
      lastServiceAt: '2026-01-01T00:00:00Z',
      nextServiceAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      overdue: false,
    },
  ];

  it('lists the devices with their state and links to them', async () => {
    global.fetch = jest.fn().mockResolvedValue(new MockResponse(JSON.stringify(items))) as any;
    const page = await newSpecPage({
      components: [HarkapMaintenanceDue],
      html: `<harkap-maintenance-due api-base="/api" base-path="/" language="sk"></harkap-maintenance-due>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/api/maintenance/due?days=30');
    const rows = page.root.shadowRoot.querySelectorAll('.item');
    expect(rows).toHaveLength(2);
    expect(rows[0].classList.contains('overdue')).toBe(true);
    expect(rows[0].querySelector('.status').textContent).toBe('Po termíne');
    expect(rows[1].querySelector('.status').textContent).toBe('O 5 dní');
    expect(rows[1].querySelector('a').getAttribute('href')).toBe('/devices/ekg%202');
  });

  it('offers a retry when the API fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;
    const page = await newSpecPage({
      components: [HarkapMaintenanceDue],
      html: `<harkap-maintenance-due api-base="/api"></harkap-maintenance-due>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('[role=alert]').textContent).toContain('Could not load');
  });
});
