import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceLogEditor } from '../harkap-ambulance-log-editor';

describe('harkap-ambulance-log-editor', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceLogEditor],
      html: `<harkap-ambulance-log-editor></harkap-ambulance-log-editor>`,
    });
    expect(page.root).toEqualHtml(`
      <harkap-ambulance-log-editor>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </harkap-ambulance-log-editor>
    `);
  });
});
