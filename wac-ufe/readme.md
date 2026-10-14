# ambulance-ufe

The micro-frontend of [Ambulance Devices](../README.md): Stencil web components with Material Web. `harkap-ambulance-wl-app` is the entry component; it renders the shell and routes to the other components.

| Command           | What it does                                                                        |
| ----------------- | ----------------------------------------------------------------------------------- |
| `npm start`       | Dev server at http://localhost:3333 with a mock API generated from the OpenAPI spec |
| `npm run build`   | Production build into `www/` (used by `docker/nginx/Dockerfile`)                    |
| `npm test`        | Spec and end-to-end tests (the end-to-end tests need Chrome)                        |
| `npm run lint`    | Check the prettier formatting (`npm run format` applies it)                         |
| `npm run openapi` | Regenerate the API client (and the Go stubs) from the spec                          |

The API client in `src/api/ambulance-wl/` (typescript-fetch) is generated from `wac-api/api/ambulance-wl.openapi.yaml` by `scripts/generate-api.sh`; do not edit it by hand. Each component's props and events are documented in the `readme.md` next to it.

`build/docker/Dockerfile` built the image for the course's Kubernetes setup (`wac-gitops/`, archived).
