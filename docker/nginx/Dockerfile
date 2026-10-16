# Builds the Stencil micro-frontend and serves it with nginx, which also proxies /api
# to the backend. Build context: the repository root.
FROM node:24-slim AS build

WORKDIR /build
# puppeteer is only needed for the e2e tests
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY wac-ufe/package.json wac-ufe/package-lock.json ./
RUN npm ci

COPY wac-ufe/ ./
RUN npm run build

# Swagger UI for /api-docs/; npm pack downloads only the package, without its dependencies
FROM node:24-slim AS api-docs
WORKDIR /docs
RUN npm pack --silent swagger-ui-dist@5.33.0 && tar -xzf swagger-ui-dist-5.33.0.tgz

FROM nginx:1.30-alpine

COPY --from=build /build/www /usr/share/nginx/html
# the service plan micro-frontend (its own Stencil build), loaded by the app shell
COPY --from=build /build/www-maintenance/build /usr/share/nginx/html/maintenance-ufe/build
COPY --from=api-docs /docs/package/swagger-ui-bundle.js /docs/package/swagger-ui.css /usr/share/nginx/html/api-docs/
COPY docker/nginx/api-docs/ /usr/share/nginx/html/api-docs/
