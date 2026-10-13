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

FROM nginx:1.30-alpine

COPY --from=build /build/www /usr/share/nginx/html
