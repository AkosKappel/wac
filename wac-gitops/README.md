# wac-gitops (archive)

**This folder is an archive.** It is the GitOps setup as it ran in the course *Webové aplikácie v prostredí cloudu* and is no longer deployed. The live demo runs with Docker Compose from the repository root, see the [main README](../README.md).

Flux CD watched this folder and applied it with Kustomize:

| Folder | Contents |
| --- | --- |
| `clusters/localhost/`, `clusters/wac-aks/` | One entry point per cluster: a local Kubernetes and the course's shared AKS cluster |
| `apps/` | The micro-frontend (`harkap-ambulance-ufe`, loaded into the course portal by the ufe-controller), the API (`harkap-ambulance-webapi`, which pulls its manifests from [`wac-api/deployments/kustomize`](../wac-api/deployments/kustomize) on GitHub) and mongo-express |
| `infrastructure/` | Flux CD, Envoy Gateway and the ufe-controller |
| `components/` | Release and developer image versions |
| `scripts/deploy.ps1` | Bootstraps Flux on a cluster |

The images it references were built from `wac-ufe/build/docker/Dockerfile` and `wac-api/build/docker/Dockerfile`.
