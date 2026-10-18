import { newSpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapAmbulanceMaintenance } from '../harkap-ambulance-maintenance';

describe('harkap-ambulance-maintenance', () => {
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
      components: [HarkapAmbulanceMaintenance],
      html: `<harkap-ambulance-maintenance api-base="/api" base-path="/"></harkap-ambulance-maintenance>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    page.root.shadowRoot.querySelectorAll<HTMLButtonElement>('.segmented button')[1].click();
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain('/api/maintenance/due?days=30');
    const rows = page.root.shadowRoot.querySelectorAll('.item');
    expect(rows).toHaveLength(2);
    expect(rows[0].classList.contains('overdue')).toBe(true);
    expect(rows[0].querySelector('.badge').textContent).toBe('Overdue');
    expect(rows[1].querySelector('.badge').textContent).toBe('In 5 days');
    expect(rows[1].querySelector('a').getAttribute('href')).toBe('/devices/ekg%202');
  });

  it('places the devices on a month calendar that the keyboard can move through', async () => {
    global.fetch = jest.fn().mockResolvedValue(new MockResponse(JSON.stringify(items))) as any;
    const page = await newSpecPage({
      components: [HarkapAmbulanceMaintenance],
      html: `<harkap-ambulance-maintenance api-base="/api" base-path="/"></harkap-ambulance-maintenance>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();
    const root = page.root.shadowRoot;

    // the calendar is the default view
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/api/maintenance/due?days=365');
    expect(root.querySelector('.segmented button[aria-pressed="true"]').textContent).toContain('Calendar');
    const selected = () => root.querySelector('.calendar td[tabindex="0"]');
    expect(selected().getAttribute('aria-current')).toBe('date');
    expect(root.querySelectorAll('.calendar td[aria-selected="true"]')).toHaveLength(1);

    // the EKG is due in five days: move there day by day and its row shows in the agenda
    for (let i = 0; i < 5; i++) {
      selected().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      await page.waitForChanges();
    }
    expect(selected().classList.contains('due')).toBe(true);
    expect(selected().querySelector('.visually-hidden').textContent).toContain('1 device');
    expect(root.querySelector('.agenda .item a').getAttribute('href')).toBe('/devices/ekg%202');

    const title = root.querySelector('#month').textContent;
    selected().dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
    await page.waitForChanges();
    expect(root.querySelector('#month').textContent).not.toBe(title);
    expect(root.querySelector('.agenda .empty')).not.toBeNull();
  });

  it('jumps to a month from the picker and back to today', async () => {
    global.fetch = jest.fn().mockResolvedValue(new MockResponse(JSON.stringify(items))) as any;
    const page = await newSpecPage({
      components: [HarkapAmbulanceMaintenance],
      html: `<harkap-ambulance-maintenance api-base="/api" base-path="/"></harkap-ambulance-maintenance>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();
    const root = page.root.shadowRoot;
    const now = new Date();
    const current = now.getFullYear() * 12 + now.getMonth();

    // this month and the twelve after it; no way back to today while on today's month
    const options = Array.from(root.querySelectorAll('.month-picker md-select-option'), o =>
      Number(o.getAttribute('value')),
    );
    expect(options).toEqual(Array.from({ length: 13 }, (_, i) => current + i));
    expect(root.querySelector('.today')).toBeNull();

    const picker = root.querySelector('.month-picker') as any;
    picker.value = String(current + 6);
    picker.dispatchEvent(new Event('change'));
    await page.waitForChanges();
    const target = new Date(now.getFullYear(), now.getMonth() + 6, 1);
    expect(root.querySelector('#month').textContent).toBe(
      target.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    );

    (root.querySelector('.today') as HTMLElement).click();
    await page.waitForChanges();
    expect(root.querySelector('.calendar td[tabindex="0"]').getAttribute('aria-current')).toBe('date');
    expect(root.querySelector('.today')).toBeNull();
  });

  it('shows the error page when the API fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;
    const page = await newSpecPage({
      components: [HarkapAmbulanceMaintenance],
      html: `<harkap-ambulance-maintenance api-base="/api"></harkap-ambulance-maintenance>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.error-page').textContent).toContain('Could not load the service plan');
  });
});
