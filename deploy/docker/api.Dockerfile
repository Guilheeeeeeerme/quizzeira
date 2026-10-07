# Quizzeira study API (apps/api) — self-contained multi-stage port of infra
# containers/quizzeira/{deps.,api.}Dockerfile (SHARED_IMAGE replaced by local npm ci).
# Migrations NEVER run here (docker-entrypoint.sh path removed); prod migration
# is the one-shot `migrate` service running deploy/migrate.sh.
# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Workspace node_modules first (all workspace manifests) then shared packages.
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
COPY apps/api apps/api
# Prisma generate parses env() from the schema only; never touches the DB.
ARG DATABASE_URL="postgresql://build:build@build.loc:5432/postgres?schema=quizzeira_study"
ARG DATABASE_DIRECT_URL="postgresql://build:build@build.loc:5432/postgres?schema=quizzeira_study"
RUN npm run build -w @quizzeira/shared \
    && npm run build -w @quizzeira/worker-kit \
    && npm run db:generate -w @quizzeira/api \
    && npm run build -w @quizzeira/api

ARG GIT_SHA=""
FROM node:22-bookworm-slim
WORKDIR /app
COPY --from=build /app ./
COPY --chown=node:node deploy/migrate.sh ./deploy/migrate.sh
ARG GIT_SHA=""
ENV NODE_ENV=production \
    GIT_SHA=${GIT_SHA} \
    PORT=3000
USER node
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
