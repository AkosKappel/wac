# ambulance-ufe

The micro-frontends of [Ambulance Devices](../README.md):

- `src/`: the app, Stencil web components with Material Web. `harkap-ambulance-wl-app` is the entry component; it renders the shell and routes to the other components. `src/sw.js` and `src/manifest.webmanifest` make it a PWA.
- `src-maintenance/`: the service plan, `harkap-maintenance-due`, a second micro-frontend with its own Stencil config (`stencil.maintenance.config.ts`) and build (`www-maintenance/`). nginx serves it under `/maintenance-ufe/`, and the shell loads it when `/maintenance` opens, passing the API base, base path and language as attributes. It uses plain HTML rather than Material Web, so the two bundles never define the same custom elements; the colours come from the shell's CSS custom properties.

| Command                     | What it does                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `npm start`                 | Dev server at http://localhost:3333 with a mock API generated from the OpenAPI spec        |
| `npm run build`             | Production builds into `www/` and `www-maintenance/` (used by `docker/nginx/Dockerfile`)   |
| `npm run start:maintenance` | Dev server for the service plan alone at http://localhost:3340 (needs a local API)         |
| `npm test`                  | Spec and end-to-end tests of both, one Chrome at a time (the end-to-end tests need Chrome) |
| `npm run lint`              | Check the prettier formatting (`npm run format` applies it)                                |
| `npm run openapi`           | Regenerate the API client (and the Go stubs) from the spec                                 |

The API client in `src/api/ambulance-wl/` (typescript-fetch) is generated from `wac-api/api/ambulance-wl.openapi.yaml` by `scripts/generate-api.sh`; do not edit it by hand. Each component's props and events are documented in the `readme.md` next to it.

`build/docker/Dockerfile` built the image for the course's Kubernetes setup (`wac-gitops/`, archived).
