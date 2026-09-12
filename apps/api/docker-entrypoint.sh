#!/bin/sh
set -e

cd /app

# Keep shared package dist in sync for tsx watch / Vite consumers.
npm run dev -w @quizzeira/shared &

cd /app/apps/api

echo "Waiting for database..."
# Local Compose schema drift may drop obsolete columns/tables (e.g. DifficultyLevel).
# Accept data loss here so the API does not loop forever on interactive Prisma prompts.
for i in $(seq 1 30); do
  if npx prisma db push --skip-generate --accept-data-loss; then
    break
  fi
  echo "Retry $i..."
  sleep 2
done

npx prisma generate
npm run db:seed || true
npm run dev
