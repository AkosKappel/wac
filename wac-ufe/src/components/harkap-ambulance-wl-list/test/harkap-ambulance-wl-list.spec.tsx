import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlList } from '../harkap-ambulance-wl-list';

describe('harkap-ambulance-wl-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlList],
      html: `<harkap-ambulance-wl-list></harkap-ambulance-wl-list>`,
    });
    expect(page.root).toEqualHtml(`
      <harkap-ambulance-wl-list>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </harkap-ambulance-wl-list>
    `);
  });
});
