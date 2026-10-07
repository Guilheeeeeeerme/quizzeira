# Quizzeira content API (apps/content-api) — self-contained port of infra
# containers/quizzeira/{deps.,content-api.}Dockerfile. Private-network only
# (no Traefik router); study api + content workers reach it over
# CONTENT_API_URL on the internal network.
# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/content-api/package.json apps/content-api/package.json
COPY apps/content-quality/package.json apps/content-quality/package.json
COPY apps/content-worker/package.json apps/content-worker/package.json
COPY apps/discovery-api/package.json apps/discovery-api/package.json
COPY apps/discovery-crawler/package.json apps/discovery-crawler/package.json
COPY apps/discovery-lifecycle/package.json apps/discovery-lifecycle/package.json
COPY apps/discovery-social-scout/package.json apps/discovery-social-scout/package.json
COPY apps/quiz-corrector/package.json apps/quiz-corrector/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/worker-kit/package.json packages/worker-kit/package.json
COPY packages/worker-kit/tsconfig.json packages/worker-kit/tsconfig.json
RUN npm ci --no-audit --no-fund

COPY packages/shared packages/shared
COPY packages/worker-kit packages/worker-kit
COPY apps/content-api apps/content-api
ARG CONTENT_DATABASE_URL="postgresql://build:build@build.loc:5432/postgres?schema=quizzeira_content"
ARG CONTENT_DATABASE_DIRECT_URL="postgresql://build:build@build.loc:5432/postgres?schema=quizzeira_content"
RUN npm run build -w @quizzeira/shared \
    && npm run build -w @quizzeira/worker-kit \
    && npm run db:generate -w @quizzeira/content-api \
    && npm run build -w @quizzeira/content-api \
    && cp -a apps/content-api/src/generated apps/content-api/dist/

ARG GIT_SHA=""
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app ./
ARG GIT_SHA=""
ENV NODE_ENV=production \
    GIT_SHA=${GIT_SHA} \
    PORT=3020
USER node
WORKDIR /app/apps/content-api
EXPOSE 3020
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s CMD node -e "fetch('http://127.0.0.1:3020/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
