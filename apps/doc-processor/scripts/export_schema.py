"""Export NormalizedDocument JSON Schema for contract tests (§47)."""

from __future__ import annotations

import json
from pathlib import Path

from app.schema import NormalizedDocument


def main() -> None:
    schema = NormalizedDocument.model_json_schema()
    out = Path(__file__).resolve().parents[1] / "normalized-document.schema.json"
    out.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
