#!/usr/bin/env bash
# Deploys a new ambulance version. Run in the deploy folder (~/deploy/ambulance):
#   ./deploy.sh              the commit of the latest green CI run on main
#   ./deploy.sh sha-1234567  a specific image tag (also how to go back)
# Steps: check both images exist, stay clear of the nightly demo reset, fetch the config
# files of that commit from GitHub into ./config, set IMAGE_TAG, pull, start, wait for the
# health check and run the smoke test. Every deploy is appended to deploys.log.
set -euo pipefail
cd "$(dirname "$0")"

repo=AkosKappel/wac
images=(ghcr.io/akoskappel/wac-api ghcr.io/akoskappel/wac-nginx)
smoke="$HOME/projects/infra/scripts/smoke-ambulance.sh"
# Repository path : path in this folder. The containers read these; they must match the
# images, so they come from the same commit.
config=(
  docker/nginx/nginx.conf:config/nginx/default.conf
  docker/mongo/app-user.js:config/mongo/app-user.js
  docker/mongo/seed.js:config/mongo/seed.js
  docker/mongo/reset.sh:config/mongo/reset.sh
)

env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2- || true; }
previous=$(env_value IMAGE_TAG)
port=$(env_value APP_PORT)

if [[ $# -ge 1 ]]; then
  tag=$1
else
  sha=$(gh run list -R "$repo" --workflow ci.yml --branch main --status success \
    --limit 1 --json headSha --jq '.[0].headSha')
  [[ -n "$sha" ]] || { echo "No green CI run on main found" >&2; exit 1; }
  tag="sha-${sha:0:7}"
fi
[[ "$tag" =~ ^sha-[0-9a-f]{7}$ ]] || { echo "Expected a tag like sha-1234567" >&2; exit 1; }
if [[ "$tag" == "$previous" ]]; then
  echo "Already running $tag"
  exit 0
fi
for image in "${images[@]}"; do
  docker manifest inspect "$image:$tag" >/dev/null ||
    { echo "Image $image:$tag not found on GHCR" >&2; exit 1; }
done

# The nightly reset rewrites the data; a restart in the middle of it is not worth the risk.
reset_time=$(env_value DEMO_RESET_TIME); reset_time=${reset_time:-03:30}
reset_tz=$(env_value DEMO_RESET_TIMEZONE); reset_tz=${reset_tz:-Europe/Bratislava}
now=$((10#$(TZ="$reset_tz" date +%H) * 60 + 10#$(TZ="$reset_tz" date +%M)))
reset=$((10#${reset_time%%:*} * 60 + 10#${reset_time##*:}))
distance=$(((now - reset + 1440) % 1440))
if ((distance < 20 || distance > 1420)); then
  echo "Within 20 minutes of the demo reset ($reset_time $reset_tz); try later" >&2
  exit 1
fi

echo "Deploying $tag (running: ${previous:-none})"
for entry in "${config[@]}"; do
  source=${entry%%:*}
  target=${entry#*:}
  mkdir -p "$(dirname "$target")"
  gh api -H "Accept: application/vnd.github.raw+json" \
    "repos/$repo/contents/$source?ref=${tag#sha-}" >"$target.part"
  mv "$target.part" "$target"
done
echo "Config of ${tag#sha-} fetched into ./config"

sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$tag/" .env
docker compose pull -q api nginx
docker compose up -d
# The config may have changed: nginx and the reset job read it only at start.
docker compose up -d --force-recreate nginx reset

echo -n "Waiting for the API through nginx"
healthy=false
for _ in $(seq 1 60); do
  if curl -fsS -m 5 -o /dev/null "http://127.0.0.1:${port:-8084}/api/health"; then
    healthy=true
    break
  fi
  echo -n .
  sleep 2
done
echo

result=failed
if $healthy && "$smoke" "http://127.0.0.1:${port:-8084}"; then
  result=ok
fi
echo "$(date -Iseconds) ${previous:-none} -> $tag $result" >>deploys.log

if [[ "$result" != ok ]]; then
  echo "Deploy of $tag failed. Logs: docker compose logs api nginx" >&2
  [[ -n "$previous" ]] && echo "Back to the previous version: ./deploy.sh $previous" >&2
  exit 1
fi
echo "Deployed $tag"
