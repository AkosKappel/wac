import { newSpecPage } from '@stencil/core/testing';
import { HarkapAmbulanceWlApp } from './../harkap-ambulance-wl-app';

describe('harkap-ambulance-wl-app', () => {
  it('renders list element by default', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app apiBase="example.com/api" basePath="/" />`,
    });
    expect(page.root).toMatchSnapshot();
  });

  it('renders editor element when relativePath starts with entry/', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app apiBase="example.com/api" basePath="/" />`,
    });
    page.root.basePath = '/some-path/';
    page.root.relativePath = '/entry/someId';
    await page.waitForChanges();
    expect(page.root).toMatchSnapshot();
  });

  it('navigates to list when editor is closed', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app apiBase="example.com/api" basePath="/" />`,
    });
    const editor = page.doc.createElement('harkap-ambulance-wl-editor');
    editor.setAttribute('entry-id', 'someId');
    page.doc.body.appendChild(editor);
    await page.waitForChanges();
    page.root.dispatchEvent(new CustomEvent('editor-closed'));
    await page.waitForChanges();
    expect(page.root.relativePath).toEqual('/list');
  });

  it('navigates to entry when list item is clicked', async () => {
    const page = await newSpecPage({
      components: [HarkapAmbulanceWlApp],
      html: `<harkap-ambulance-wl-app apiBase="example.com/api" basePath="/" />`,
    });
    const list = page.doc.createElement('harkap-ambulance-wl-list');
    page.doc.body.appendChild(list);
    await page.waitForChanges();
    list.dispatchEvent(new CustomEvent('entry-clicked', { detail: 'someId' }));
    await page.waitForChanges();
    expect(page.root.relativePath).toEqual('/entry/someId');
  });
});
