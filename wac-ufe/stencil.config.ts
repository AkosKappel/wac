import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ambulance-ufe',
  globalScript: 'src/global/app.ts',
  // keep the entry script external, so the Content-Security-Policy can forbid inline scripts
  allowInlineScripts: false,
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      // a hand-written service worker (src/sw.js) instead of Stencil's Workbox one
      serviceWorker: null,
      copy: [{ src: 'sw.js' }, { src: 'manifest.webmanifest' }],
    },
  ],
  testing: {
    browserHeadless: 'new',
    // one Chrome at a time: parallel e2e workers overloaded the home server on 2026-10-16
    maxWorkers: 1,
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },
  },
};
