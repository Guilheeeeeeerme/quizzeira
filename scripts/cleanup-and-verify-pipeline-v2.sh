#!/usr/bin/env bash
# Remove §48.8 legacy tombstones then run the full pipeline v2 gate.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -f \
  apps/content-worker/src/extraction/pdf-text.ts \
  apps/content-worker/src/extraction/chunk.ts \
  apps/content-worker/src/extraction/index.ts \
  apps/discovery-crawler/src/listing-parse.ts \
  apps/discovery-crawler/src/listing-parse.spec.ts

# Drop tombstone-only excludes (specs remain excluded via **/*.spec.ts).
python3 - <<'PY'
from pathlib import Path

def strip_excludes(path: Path, drop: set[str]) -> None:
    text = path.read_text(encoding="utf-8")
    lines = []
    for line in text.splitlines(True):
        if any(d in line for d in drop):
            continue
        lines.append(line)
    path.write_text("".join(lines), encoding="utf-8")

strip_excludes(
    Path("apps/content-worker/tsconfig.json"),
    {
        "src/extraction/pdf-text.ts",
        "src/extraction/chunk.ts",
        "src/extraction/index.ts",
    },
)
strip_excludes(
    Path("apps/discovery-crawler/tsconfig.json"),
    {"src/listing-parse.ts", "src/listing-parse.spec.ts"},
)
PY

# pdf-text.spec covers html-text only — keep it; chunk.spec imports chunker.
exec bash scripts/verify-pipeline-v2.sh
