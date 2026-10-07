# Quizzeira discovery crawler (apps/discovery-crawler) — Playwright base, exactly
# the infra image (mcr.microsoft.com/playwright:v1.50.1-jammy; playwright dep
# pinned 1.50.1 in package.json must match). Runs as non-root pwuser; needs the
# /dev/shm headroom (compose `shm_size: 1gb`, see compose.prod.yml).
# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/playwright:v1.50.1-jammy AS build
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
COPY apps/discovery-crawler apps/discovery-crawler
RUN npm run build -w @quizzeira/shared \
    && npm run build -w @quizzeira/worker-kit

ARG GIT_SHA=""
FROM mcr.microsoft.com/playwright:v1.50.1-jammy
WORKDIR /app
COPY --from=build --chown=pwuser:pwuser /app ./
ENV NODE_ENV=production \
    GIT_SHA=${GIT_SHA}
USER pwuser
CMD ["sh", "-c", "exec node --import tsx apps/discovery-crawler/src/index.ts"]
