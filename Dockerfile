# syntax=docker/dockerfile:1

# DevMate web frontend — production image.
#
# No DevMate backend exists yet (see docs/web-api-gaps.md), so the default
# build ships with MSW mocks baked in (VITE_ENABLE_MOCKS=true) and is
# self-contained: `docker compose up` serves a fully working demo with no
# other services required. Point DEVMATE_API_PROXY_TARGET at a real backend
# and rebuild with --build-arg VITE_ENABLE_MOCKS=false once one exists.
#
# Vite inlines VITE_-prefixed vars at build time, not at container start —
# changing them requires rebuilding this image, not just restarting it.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .

ARG VITE_ENABLE_MOCKS=true
ARG VITE_DEVMATE_API_BASE_URL=/api/v1
ARG VITE_BUILD_SHA=docker
ENV VITE_ENABLE_MOCKS=${VITE_ENABLE_MOCKS} \
    VITE_DEVMATE_API_BASE_URL=${VITE_DEVMATE_API_BASE_URL} \
    VITE_BUILD_SHA=${VITE_BUILD_SHA}

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV DEVMATE_API_PROXY_TARGET=http://backend:8000
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
