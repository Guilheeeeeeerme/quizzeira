#!/bin/sh
set -e

cd /app

# Keep shared package dist in sync for tsx watch / Vite consumers.
npm run dev -w @quizzeira/shared &

cd /app/apps/api

echo "Waiting for database (prisma migrate deploy)..."
# Never use `db push --accept-data-loss` against managed Supabase.
for i in $(seq 1 30); do
  if npx prisma migrate deploy; then
    break
  fi
  echo "Retry $i..."
  sleep 2
done

npx prisma generate
npm run db:seed || true
npm run dev
