#!/usr/bin/env bash
# Pipeline v2 verification gate — run from repo root after shell access is available.
# Mirrors .github/workflows/pipeline-v2.yml node-gates (+ doc-processor when Python is present).
set -euo pipefail
cd "$(dirname "$0")/.."

npm install

# Same §48.8 tombstone cleanup as CI (rm -f is a no-op when already deleted).
rm -f \
  apps/content-worker/src/extraction/pdf-text.ts \
  apps/content-worker/src/extraction/chunk.ts \
  apps/content-worker/src/extraction/index.ts \
  apps/discovery-crawler/src/listing-parse.ts \
  apps/discovery-crawler/src/listing-parse.spec.ts

npm run build -w @quizzeira/shared
npm run db:generate
npm run test:shared
npm run test:worker-kit
npm run test:regression
npm run test:quality
npm run test:discovery
npm run test:content
npm run typecheck
npm run lint
npm run build
if command -v python3 >/dev/null 2>&1; then
  npm run test:doc-processor
else
  echo "python3 missing — doc-processor tests required when Python is available" >&2
  exit 1
fi
# Root `lint` aliases to typecheck (no separate eslint).
echo "OK: verification suite finished (typecheck + tests + build + doc-processor)"
