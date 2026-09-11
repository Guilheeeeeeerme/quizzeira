#!/bin/sh
set -e

cd /app
# Keep shared package dist in sync for tsx watch consumers.
npm run dev -w @quizzeira/shared &

cd /app/apps/content-api

echo "Waiting for quizzeira_content (with pgvector)..."
for i in $(seq 1 30); do
  if npx prisma migrate deploy 2>/dev/null; then
    break
  fi
  echo "Retry $i..."
  sleep 2
done

npx prisma generate
npm run dev
