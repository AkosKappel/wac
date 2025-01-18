import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-wl-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<harkap-ambulance-wl-editor></harkap-ambulance-wl-editor>');

    const element = await page.find('harkap-ambulance-wl-editor');
    expect(element).toHaveClass('hydrated');
  });
});
