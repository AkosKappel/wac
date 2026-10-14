#!/bin/sh
# Generates the Go server stubs (wac-api) and the TypeScript client (wac-ufe) from
# wac-api/api/ambulance-wl.openapi.yaml with one pinned openapi-generator version.
# Needs Docker and Go. CI runs it and fails when the committed files differ.
set -eu
cd "$(dirname "$0")/.."

image=openapitools/openapi-generator-cli:v7.25.0
run() { docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/repo" "$image" "$@"; }

# Go: custom templates in wac-api/scripts/templates; the hand-written impl_*.go files are kept
run generate -c /repo/wac-api/scripts/generator-cfg.yaml
gofmt -w wac-api/internal/ambulance_wl wac-api/api

# TypeScript: fetch client, dates stay ISO strings like in the JSON
rm -rf wac-ufe/src/api/ambulance-wl
run generate -g typescript-fetch \
  -i /repo/wac-api/api/ambulance-wl.openapi.yaml \
  -o /repo/wac-ufe/src/api/ambulance-wl \
  --type-mappings=DateTime=string,date=string \
  --global-property=apiDocs=false,modelDocs=false \
  --additional-properties=supportsES6=true,withoutRuntimeChecks=true
