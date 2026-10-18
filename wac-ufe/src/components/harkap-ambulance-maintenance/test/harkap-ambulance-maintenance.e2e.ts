import { newE2EPage } from '@stencil/core/testing';

describe('harkap-ambulance-maintenance', () => {
  it('shows the current month in the picker after moving past the year ahead', async () => {
    const page = await newE2EPage();
    await page.evaluateOnNewDocument(() => {
      window.fetch = async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    });
    await page.setContent('<harkap-ambulance-maintenance api-base="/api"></harkap-ambulance-maintenance>');
    await page.waitForChanges();

    const next = await page.find('harkap-ambulance-maintenance >>> .calendar-head md-icon-button:nth-of-type(2)');
    for (let i = 0; i < 14; i++) {
      await next.click();
      await page.waitForChanges();
    }
    const picker = await page.evaluate(() => {
      const root = document.querySelector('harkap-ambulance-maintenance').shadowRoot;
      return {
        month: root.querySelector('#month').textContent,
        shown: (root.querySelector('.month-picker') as any).displayText,
      };
    });
    expect(picker.shown).toBe(picker.month);
  });
});
