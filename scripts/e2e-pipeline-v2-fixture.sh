#!/usr/bin/env bash
# Deterministic pipeline-v2 fixture E2E outline (§41.3).
# Requires compose + LLM_PROVIDER=fixture. Does not replace unit gates.
set -euo pipefail
cd "$(dirname "$0")/.."

export LLM_PROVIDER=fixture
export LLM_PROVIDER_ORDER=fixture

echo "=== fixture provider unit harness ==="
npm run test:worker-kit
npm run test:content -- --test-name-pattern='fixture harness|listing-trivia|golden edital'

echo "=== doc-processor golden + perf ==="
npm run test:doc-processor

echo "OK: fixture E2E slice finished (full compose crawl not driven here; use compose + fixture sources manually)"
