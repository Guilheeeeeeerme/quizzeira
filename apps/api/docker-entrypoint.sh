#!/bin/sh
set -e

cd /app

# Keep shared package dist in sync for tsx watch / Vite consumers.
npm run dev -w @quizzeira/shared &

cd /app/apps/api

echo "Waiting for database..."
for i in $(seq 1 30); do
  if npx prisma db push --skip-generate 2>/dev/null; then
    break
  fi
  echo "Retry $i..."
  sleep 2
done

npx prisma generate
# Platform always; demo only when SEED_DEMO is truthy (default 1 in local compose).
export SEED_DEMO="${SEED_DEMO:-1}"
npm run db:seed || true
npm run dev
