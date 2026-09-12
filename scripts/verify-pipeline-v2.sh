#!/usr/bin/env bash
# Pipeline v2 verification gate — run from repo root after shell access is available.
set -euo pipefail
cd "$(dirname "$0")/.."

npm install
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
# Root package has no eslint script; typecheck is the static gate.
echo "OK: verification suite finished (typecheck + tests + build + doc-processor)"
