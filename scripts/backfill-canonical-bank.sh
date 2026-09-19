#!/usr/bin/env bash
# Canonical bank backfill + dual-read parity check (§7, START_HERE.md Next
# item 3). Idempotent — safe to re-run; `enqueueJob`-style upserts and
# `.catch(() => null)` guards in backfillCanonicalBank() mean a repeat run
# only fills gaps, never duplicates rows.
#
# Deploys are owned by the infra repo (Jenkins job `quizzeira`); this script
# is what that job (or an operator) runs against a live content-api after a
# deploy that touches the canonical bank, not something CI runs on every PR.
#
# Usage:
#   CONTENT_API_URL=https://api.quizzeira.ferredemo.dev \
#   CONTENT_API_INTERNAL_KEY=... \
#   ./scripts/backfill-canonical-bank.sh [examSlug ...]
#
# With no examSlug args, only the backfill + status run — pass one or more
# exam slugs to also run the dual-read parity check for each, which is what
# tells you whether it's safe to drop `/published/sample`'s legacy
# examSlug/syllabusNodeId query path for that exam.
set -euo pipefail

: "${CONTENT_API_URL:?set CONTENT_API_URL, e.g. https://api.quizzeira.ferredemo.dev}"
: "${CONTENT_API_INTERNAL_KEY:?set CONTENT_API_INTERNAL_KEY (INTERNAL_API_KEY_CONTENT or INTERNAL_API_KEY)}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

call() {
  curl -sS -X "$1" "${CONTENT_API_URL}$2" \
    -H "x-internal-key: ${CONTENT_API_INTERNAL_KEY}" \
    -H "content-type: application/json"
}

echo "== canonical bank backfill (idempotent) =="
call POST /internal/canonical/backfill | tee /dev/stderr | jq -e '.ok == true' >/dev/null
echo

echo "== canonical bank status =="
call GET /internal/canonical/status
echo

if [ "$#" -eq 0 ]; then
  echo "no examSlug args given — skipping dual-read parity check" >&2
  exit 0
fi

failed=0
for exam in "$@"; do
  echo "== dual-read parity: ${exam} =="
  encoded="$(jq -rn --arg v "$exam" '$v|@uri')"
  result="$(call GET "/internal/canonical/parity-check?examSlug=${encoded}")"
  echo "$result" | jq .
  gaps="$(echo "$result" | jq '.missingFromCanonical | length')"
  if [ "$gaps" != "0" ]; then
    echo "WARNING: ${gaps} legacy-published question(s) for '${exam}' are not reachable via canonical applicability — do not drop the legacy sampling path for this exam yet." >&2
    failed=1
  fi
done

exit "$failed"
