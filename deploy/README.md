# Production deployment

The live app runs from `~/deploy/ambulance` on the home server, not from this repository,
so the development checkout can change branches, rebuild and reset its database without
touching it. Operations live in the infra repository (`apps/ambulance/`).

| | Development (`~/projects/wac`) | Production (`~/deploy/ambulance`) |
| --- | --- | --- |
| Compose project | `wac` (containers `wac-dev-*`) | `ambulance` (containers `ambulance-*`) |
| Images | built locally or pulled | `ghcr.io/akoskappel/wac-api` and `wac-nginx` at `IMAGE_TAG` |
| Config (nginx, Mongo scripts) | `docker/` in the checkout | `config/`, fetched from GitHub at the deployed commit |
| Ports | staging `8081`, `27018` | `127.0.0.1:8084`, MongoDB without a host port |
| Public URL | none (no sidecar) | https://ambulance.tailb52c43.ts.net |

## First setup

```bash
mkdir -p ~/deploy/ambulance/tailscale
cp deploy/compose.yaml deploy/compose.tailscale.yaml deploy/deploy.sh ~/deploy/ambulance/
cp deploy/tailscale/serve.json ~/deploy/ambulance/tailscale/
cp deploy/.env.example ~/deploy/ambulance/.env   # fill in the passwords, chmod 600
```

Put the Tailscale auth key into `tailscale/ts.env` (`TS_AUTHKEY=...`, `chmod 600`), then
`./deploy.sh`.

## Deploy a new version

After CI on `main` is green, in `~/deploy/ambulance`: `./deploy.sh`. It takes the latest
green commit, checks both images exist, refuses to run within 20 minutes of the nightly
reset, fetches `nginx.conf` and the Mongo scripts of that commit into `config/`, sets
`IMAGE_TAG`, pulls, starts, waits for `/api/health` and runs the smoke test
(`~/projects/infra/scripts/smoke-ambulance.sh`). Each deploy is appended to `deploys.log`.
`./deploy.sh sha-1234567` deploys a given tag, which is also how to go back.

When a file in this `deploy/` folder changed, copy it to the deploy folder first.
