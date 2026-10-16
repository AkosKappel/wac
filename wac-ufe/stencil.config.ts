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
      serviceWorker: null, // disable service workers
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
