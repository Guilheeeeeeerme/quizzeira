#!/bin/sh
set -e

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
npm run db:seed || true
npm run dev
