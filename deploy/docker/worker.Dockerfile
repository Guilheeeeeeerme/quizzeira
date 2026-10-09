# Quizzeira workers (apps/quiz-corrector, apps/content-worker, apps/content-quality)
# — one Dockerfile, ARG APP selects the entry, mirroring infra
# containers/quizzeira/worker.Dockerfile (same naming, no prisma client, tsx runner).
# Build:  docker build -f deploy/docker/worker.Dockerfile --build-arg APP=quiz-corrector …
# Quizzeira workers run WITHOUT Headroom (LLM_USE_HEADROOM=false, direct public
# provider URLs) — hard rule, see ../README.md and infra docs/quizzeira-headroom.md.
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
# Workers run from source via tsx (no per-app build); ship the three sources.
COPY apps/quiz-corrector apps/quiz-corrector
COPY apps/content-worker apps/content-worker
COPY apps/content-quality apps/content-quality
RUN npm run build -w @quizzeira/shared \
    && npm run build -w @quizzeira/worker-kit

ARG APP
ARG GIT_SHA=unknown
FROM node:22-bookworm-slim
WORKDIR /app
# ARG must be re-declared after FROM for ENV interpolation in this stage.
ARG APP
ARG GIT_SHA=unknown
COPY --from=build /app ./
ENV NODE_ENV=production \
    WORKER_APP=${APP} \
    GIT_SHA=${GIT_SHA}
USER node
CMD ["sh", "-c", "exec node --import tsx apps/$WORKER_APP/src/index.ts"]
