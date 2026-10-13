# Ambulance Devices

A register of medical devices in hospital departments: devices with warranty, price and department, each with its own operations log. Built in the course *Webové aplikácie v prostredí cloudu* (Web Applications in the Cloud) as a micro-frontend, a REST API and a GitOps setup for Kubernetes. The UI is in Slovak.

**Live demo:** https://ambulance.tailb52c43.ts.net (the demo data is restored every night at 03:00 CET).

## Repository

| Folder | Contents |
| --- | --- |
| [`wac-ufe/`](wac-ufe/) | Micro-frontend: Stencil web components with Material Web, API client generated from the OpenAPI spec |
| [`wac-api/`](wac-api/) | REST API in Go (Gin) on MongoDB, server stubs generated from [`ambulance-wl.openapi.yaml`](wac-api/api/ambulance-wl.openapi.yaml) |
| [`wac-gitops/`](wac-gitops/) | Kubernetes manifests (Kustomize) deployed by Flux CD to the course's AKS cluster and to a local cluster, with Envoy Gateway and the ufe-controller that loads the micro-frontend into the shared portal |
| [`docker/`](docker/) | The single-host deployment used for the live demo |

## Run locally

Needs Docker. Copy `.env.example` to `.env`, set `AMBULANCE_API_MONGODB_PASSWORD`, then:

```bash
docker compose up -d --build
```

The app is served at http://127.0.0.1:8084. nginx serves the built frontend and proxies `/api` to the Go service; MongoDB starts with the demo data from [`docker/mongo/seed.js`](docker/mongo/seed.js) and is reachable at `127.0.0.1:27019` for tools such as Compass.

## Deployment

The live demo runs on a home server with Docker Compose instead of Kubernetes: nginx, the API, MongoDB and a small service that restores the demo data every night. A Tailscale sidecar ([`docker-compose.tailscale.yml`](docker-compose.tailscale.yml)) publishes it over HTTPS with Funnel. The Kubernetes setup in `wac-gitops/` is kept as it ran in the course.
