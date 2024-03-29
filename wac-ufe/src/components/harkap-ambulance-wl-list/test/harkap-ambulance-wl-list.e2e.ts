import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-wl-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<harkap-ambulance-wl-list></harkap-ambulance-wl-list>');

    const element = await page.find('harkap-ambulance-wl-list');
    expect(element).toHaveClass('hydrated');
  });
});
