import { Config } from '@stencil/core';

// The service plan micro-frontend: a second web component with its own namespace and build,
// served under /maintenance-ufe/ and loaded by the main app's shell on the /maintenance page.
// It renders plain HTML instead of Material Web, so the two bundles never register the same
// custom elements, and takes the shell's colours through inherited CSS custom properties.
// Its spec runs with the main app's tests (npm test).
export const config: Config = {
  namespace: 'maintenance-ufe',
  srcDir: 'src-maintenance',
  tsconfig: 'tsconfig.maintenance.json',
  allowInlineScripts: false,
  outputTargets: [
    {
      type: 'www',
      dir: 'www-maintenance',
      serviceWorker: null,
    },
  ],
};
