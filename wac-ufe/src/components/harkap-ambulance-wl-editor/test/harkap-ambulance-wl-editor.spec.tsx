import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlEditor } from './../harkap-ambulance-wl-editor';

describe('harkap-ambulance-wl-editor', () => {
  it('renders correctly when entryId is @new', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlEditor],
      html: `<harkap-ambulance-wl-editor entryId="@new" apiBase="example.com/api" basePath="/" />`,
    });
    expect(page.root).toMatchSnapshot();
  });

  it('renders correctly when entryId is not @new', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlEditor],
      html: `<harkap-ambulance-wl-editor entryId="someId" apiBase="example.com/api" basePath="/" />`,
    });
    expect(page.root).toMatchSnapshot();
  });

  it('updates entry on input', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlEditor],
      html: `<harkap-ambulance-wl-editor entryId="@new" apiBase="example.com/api" basePath="/" />`,
    });
    const input = page.root.querySelector('md-filled-text-field[label="Názov zariadenia"] input') as HTMLInputElement;
    input.value = 'Test device';
    input.dispatchEvent(new Event('input'));
    await page.waitForChanges();
    expect(page.root.entry.name).toEqual('Test device');
  });

});
