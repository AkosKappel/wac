import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { MockResponse } from '@stencil/core/mock-doc';
import { HarkapAmbulanceCommandPalette } from '../harkap-ambulance-command-palette';
import { settings } from '../../../utils/settings';

const devices = [
  { id: 'ekg-1', name: 'EKG Schiller', deviceId: 'EKG-001', warrantyUntil: '2030-01-01T00:00:00Z' },
  { id: 'rtg-1', name: 'Röntgen', deviceId: 'RTG-001', warrantyUntil: '2030-01-01T00:00:00Z' },
];
const departments = [{ name: 'Kardiológia', code: 'kar' }];

describe('harkap-ambulance-command-palette', () => {
  let page: SpecPage;
  let dialog: HTMLDialogElement;
  let input: HTMLInputElement;

  const labels = () => Array.from(page.root.shadowRoot.querySelectorAll('[role=option] .text'), o => o.textContent);
  const selected = () => page.root.shadowRoot.querySelector('[aria-selected=true] .text').textContent;
  const press = async (key: string, target: EventTarget = input, ctrlKey = false) => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey, bubbles: true }));
    await page.waitForChanges();
  };
  const type = async (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();
  };

  beforeEach(async () => {
    settings.state.language = 'en';
    settings.state.theme = 'light';
    global.fetch = jest.fn(
      async (url: string) => new MockResponse(JSON.stringify(url.includes('/departments') ? departments : devices)),
    ) as any;
    page = await newSpecPage({
      components: [HarkapAmbulanceCommandPalette],
      html: `<harkap-ambulance-command-palette api-base="/api"></harkap-ambulance-command-palette>`,
    });
    dialog = page.root.shadowRoot.querySelector('dialog');
    input = page.root.shadowRoot.querySelector('input');
    // the mock document has no modal dialogs
    dialog.showModal = jest.fn(() => (dialog.open = true));
    dialog.close = jest.fn(() => (dialog.open = false));
  });

  it('lists the pages and actions before anything is typed', () => {
    expect(labels()).toEqual([
      'Home',
      'Devices',
      'New device',
      'Service',
      'Departments',
      'About',
      'Prepnúť do slovenčiny',
      'Switch to dark theme',
    ]);
    expect(input.getAttribute('aria-activedescendant')).toEqual('palette-option-0');
  });

  it('opens with Ctrl+K and finds devices by name or identifier, ignoring accents', async () => {
    await press('k', page.doc, true);
    expect(dialog.showModal).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);

    await type('rontgen');
    expect(labels()).toEqual(['RöntgenRTG-001', 'Search devices for “rontgen”']);

    await type('ekg-0');
    expect(labels()).toEqual(['EKG SchillerEKG-001', 'Search devices for “ekg-0”']);
  });

  it('finds departments and offers a list search for the typed text', async () => {
    await press('k', page.doc, true);
    await type('kard');
    expect(labels()).toEqual(['KardiológiaDevices in this department', 'Search devices for “kard”']);
  });

  it('moves the selection with the arrow keys and wraps around', async () => {
    await type('dev');
    expect(selected()).toEqual('Devices');
    await press('ArrowDown');
    expect(selected()).toEqual('New device');
    await press('ArrowDown');
    await press('ArrowDown');
    expect(selected()).toEqual('Devices');
    await press('ArrowUp');
    expect(selected()).toEqual('Search devices for “dev”');
    expect(input.getAttribute('aria-activedescendant')).toEqual(
      page.root.shadowRoot.querySelector('[aria-selected=true]').id,
    );
  });

  it('runs the selected action on Enter and closes', async () => {
    await press('k', page.doc, true);
    await type('dark');
    await press('Enter');
    expect(settings.state.theme).toEqual('dark');
    expect(dialog.close).toHaveBeenCalled();
  });

  it('closes on a second Ctrl+K', async () => {
    await press('k', page.doc, true);
    await press('k', page.doc, true);
    expect(dialog.close).toHaveBeenCalled();
  });
});
