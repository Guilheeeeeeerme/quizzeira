# Quizzeira social scout (apps/discovery-social-scout) — self-contained port of
# infra containers/quizzeira/discovery-social-scout.Dockerfile. tsx runner.
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
COPY apps/discovery-source-scout/package.json apps/discovery-source-scout/package.json
COPY apps/discovery-portal-monitor/package.json apps/discovery-portal-monitor/package.json
COPY apps/content-freshness/package.json apps/content-freshness/package.json
COPY apps/quiz-corrector/package.json apps/quiz-corrector/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/worker-kit/package.json packages/worker-kit/package.json
COPY packages/worker-kit/tsconfig.json packages/worker-kit/tsconfig.json
RUN npm ci --no-audit --no-fund

COPY packages/shared packages/shared
COPY packages/worker-kit packages/worker-kit
COPY apps/discovery-social-scout apps/discovery-social-scout
RUN npm run build -w @quizzeira/shared \
    && npm run build -w @quizzeira/worker-kit

ARG GIT_SHA=""
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production \
    GIT_SHA=${GIT_SHA}
USER node
CMD ["sh", "-c", "exec node --import tsx apps/discovery-social-scout/src/index.ts"]
