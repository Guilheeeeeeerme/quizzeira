#!/usr/bin/env bash
# Deterministic pipeline-v2 fixture E2E outline (§41.3).
# Requires compose + LLM_PROVIDER=fixture for generation harness only.
# Does not replace unit gates; full compose crawl is manual.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== worker-kit (real provider mocks; do not force fixture) ==="
npm run test:worker-kit

echo "=== fixture provider generation / discovery harness ==="
export LLM_PROVIDER=fixture
export LLM_PROVIDER_ORDER=fixture
npm run test:content -- --test-name-pattern='fixture harness|listing-trivia|golden edital'
npm run test:discovery -- --test-name-pattern='listing-trivia|SSRF|storeArtifact|parseDetail'

echo "=== doc-processor golden + perf ==="
# Fixture LLM env is irrelevant to Python tests.
npm run test:doc-processor

echo "OK: fixture E2E slice finished (full compose crawl not driven here; use COMPOSE_PROJECT_NAME=quizzeira-cursor + fixture sources manually)"
