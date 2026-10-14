import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-wl-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<harkap-ambulance-wl-app></harkap-ambulance-wl-app>');

    const element = await page.find('harkap-ambulance-wl-app');
    expect(element).toHaveClass('hydrated');
  });
});
