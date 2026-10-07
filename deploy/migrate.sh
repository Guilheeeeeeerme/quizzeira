#!/usr/bin/env sh
# Production migration entrypoint for Quizzeira (one-shot `migrate` service).
#
# Runs `prisma migrate deploy` against the THREE existing Supabase schemas
# (single project, pooler host, ?schema=quizzeira_study / quizzeira_discovery /
# quizzeira_content — never a new project or schema) plus the users-only
# platform seed for Study. App containers never migrate on start: this is the
# only place migrations run in production.
#
# SKIP_MIGRATIONS=1 → exit 0 immediately (rollback switch).
# The `migrate` profile stays enabled in Dokploy so each deploy recreates and
# re-runs it; `migrate deploy` is idempotent.
set -eu

if [ "${SKIP_MIGRATIONS:-}" = "1" ]; then
  echo "[migrate] SKIP_MIGRATIONS=1 — skipping all migrations"
  exit 0
fi

GIT_SHA="${GIT_SHA:-unknown}"
echo "[migrate] image sha ${GIT_SHA}"

cd /app/apps/api
echo "[migrate] schema quizzeira_study — prisma migrate deploy"
npm run db:migrate

cd /app/apps/discovery-api
echo "[migrate] schema quizzeira_discovery — prisma migrate deploy"
npm run db:migrate

cd /app/apps/content-api
echo "[migrate] schema quizzeira_content — prisma migrate deploy"
npm run db:migrate

# Users-only platform seed (admin root); no question-bank seed ever.
echo "[migrate] platform seed (users only)"
cd /app
if [ -z "${DEV_ROOT_EMAIL:-}" ] || [ -z "${DEV_ROOT_PASSWORD:-}" ]; then
  echo "[migrate] DEV_ROOT_EMAIL/DEV_ROOT_PASSWORD not set — skipping platform seed"
else
  npm run db:seed:platform -w @quizzeira/api
fi

echo "[migrate] done (sha ${GIT_SHA})"
