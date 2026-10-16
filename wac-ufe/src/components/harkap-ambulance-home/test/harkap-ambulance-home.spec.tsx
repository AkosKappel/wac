import { newSpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapAmbulanceHome } from '../harkap-ambulance-home';

describe('harkap-ambulance-home', () => {
  it('shows the statistics and the service count', async () => {
    const stats = {
      deviceCount: 2,
      totalValue: 1000,
      warranty: { ok: 1, expiring: 0, expired: 1 },
      departments: [{ code: 'rad', name: 'Radiology', count: 2, totalValue: 1000, averageValue: 500 }],
      logsPerMonth: [],
    };
    global.fetch = jest.fn((url: string) =>
      Promise.resolve(new MockResponse(JSON.stringify(url.includes('/stats') ? stats : [{ id: 'x' }]))),
    ) as any;
    const page = await newSpecPage({
      components: [HarkapAmbulanceHome],
      html: `<harkap-ambulance-home api-base="/api" base-path="/"></harkap-ambulance-home>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    const values = Array.from(page.root.shadowRoot.querySelectorAll('.stat-value')).map(el => el.textContent);
    expect(values[0]).toEqual('2');
    expect(values[3]).toEqual('1');
    expect(values[4]).toEqual('1');
    const department = page.root.shadowRoot.querySelector('.departments a');
    expect(department.getAttribute('href')).toEqual('/devices?department=rad');
    expect(page.root.shadowRoot.querySelectorAll('.month-bars li')).toHaveLength(12);
  });

  it('keeps the page when the API fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as any;
    const page = await newSpecPage({
      components: [HarkapAmbulanceHome],
      html: `<harkap-ambulance-home></harkap-ambulance-home>`,
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    await page.waitForChanges();

    expect(page.root.shadowRoot.querySelector('.load-failed')).not.toBeNull();
    expect(page.root.shadowRoot.querySelector('h1')).not.toBeNull();
  });
});
