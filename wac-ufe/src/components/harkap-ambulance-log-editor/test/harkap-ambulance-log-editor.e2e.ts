import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-log-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<harkap-ambulance-log-editor></harkap-ambulance-log-editor>');

    const element = await page.find('harkap-ambulance-log-editor');
    expect(element).toHaveClass('hydrated');
  });
});
