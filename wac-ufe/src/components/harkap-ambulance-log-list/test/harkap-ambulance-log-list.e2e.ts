import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-log-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<harkap-ambulance-log-list></harkap-ambulance-log-list>');

    const element = await page.find('harkap-ambulance-log-list');
    expect(element).toHaveClass('hydrated');
  });
});
