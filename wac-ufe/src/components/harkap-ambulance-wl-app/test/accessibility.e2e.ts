import { E2EPage, newE2EPage } from '@stencil/core/testing';
import { readFileSync } from 'fs';

const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const device = {
  id: 'ekg-1',
  name: 'EKG',
  deviceId: 'EKG-001',
  warrantyUntil: '2030-01-01T00:00:00Z',
  price: 1200,
  department: { name: 'Kardiológia', code: 'kar' },
  serviceIntervalDays: 365,
  lastServiceAt: '2026-01-01T10:00:00Z',
  logList: [{ id: 'log-1', deviceId: 'ekg-1', text: 'Purchase', type: 'purchase', createdAt: '2026-01-01T10:00:00Z' }],
  history: [{ changedAt: '2026-02-01T10:00:00Z', changes: [{ field: 'price', from: '1000', to: '1200' }] }],
};

const stats = {
  deviceCount: 1,
  totalValue: 1200,
  warranty: { ok: 1, expiring: 0, expired: 0 },
  departments: [{ code: 'kar', name: 'Kardiológia', count: 1, totalValue: 1200, averageValue: 1200 }],
  logsPerMonth: [{ month: '2026-01', count: 1 }],
};

// answers the API calls in the browser, so every screen renders with data
function stubApi(page: E2EPage) {
  return page.evaluateOnNewDocument(
    (sample, stats) => {
      const json = (body: unknown) =>
        new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
      window.fetch = async (input: RequestInfo | URL) => {
        const url = String(input instanceof Request ? input.url : input);
        if (url.includes('/stats')) return json(stats);
        if (url.includes('/maintenance')) return json([]);
        if (url.includes('/departments')) return json([{ ...sample.department, floor: '2', head: 'MUDr. Ján Novák' }]);
        if (url.includes('/logs')) return json(sample.logList);
        if (/\/entries\/[^/]+$/.test(url)) return json(sample);
        return json([sample]);
      };
    },
    device,
    stats,
  );
}

async function violations(page: E2EPage) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const results = await (window as any).axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
    return results.violations
      .map(v => ({
        id: v.id,
        // Material Web gives interactive list items role="listitem" (its b/265339866);
        // the big error number is an aria-hidden watermark, decoration needs no contrast
        targets: v.nodes
          .map(n => JSON.stringify(n.target))
          .filter(t => !(v.id === 'aria-allowed-role' && t.includes('md-list-item')) && !t.includes('.error-code')),
      }))
      .filter(v => v.targets.length);
  });
}

async function render(html: string, colorScheme: 'light' | 'dark' = 'light') {
  const page = await newE2EPage();
  await stubApi(page);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }]);
  await page.setContent(html);
  // as in index.html: without the icon font, axe reads ligatures such as "arrow_back" as button text
  await page.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForChanges();
  // the shell sets the title and language; standalone components need them for the page rules
  await page.evaluate(() => {
    document.documentElement.lang ||= 'en';
    document.title ||= 'Ambulance Devices';
  });
  return page;
}

describe('accessibility', () => {
  it.each([
    ['app shell with the homepage', '<harkap-ambulance-wl-app api-base="/api"></harkap-ambulance-wl-app>'],
    ['device list', '<harkap-ambulance-wl-list api-base="/api"></harkap-ambulance-wl-list>'],
    ['device editor', '<harkap-ambulance-wl-editor api-base="/api" entry-id="ekg-1"></harkap-ambulance-wl-editor>'],
    ['new device form', '<harkap-ambulance-wl-editor api-base="/api" entry-id="@new"></harkap-ambulance-wl-editor>'],
    [
      'log editor',
      '<harkap-ambulance-log-editor api-base="/api" entry-id="ekg-1" log-id="log-1"></harkap-ambulance-log-editor>',
    ],
    ['about page', '<harkap-ambulance-about></harkap-ambulance-about>'],
    ['departments page', '<harkap-ambulance-departments api-base="/api"></harkap-ambulance-departments>'],
  ])('%s has no WCAG A/AA violations', async (_, html) => {
    const page = await render(html);
    expect(await violations(page)).toEqual([]);
  });

  it('dark theme has no WCAG A/AA violations', async () => {
    const page = await render('<harkap-ambulance-wl-app api-base="/api"></harkap-ambulance-wl-app>', 'dark');
    expect(await violations(page)).toEqual([]);
  });
});
