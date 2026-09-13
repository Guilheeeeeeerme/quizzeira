"""Assert pydantic NormalizedDocument stays aligned with the hand catalogue (§41.2)."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import get_args

from app.schema import (
    SCHEMA_VERSION,
    BlockType,
    ExtractorEngine,
    NormalizedDocument,
    Section,
    SectionFlag,
)

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE_PATH = ROOT / "normalized-document.schema.json"


def main() -> int:
    catalogue = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    props = (NormalizedDocument.model_json_schema().get("properties") or {})

    if catalogue.get("schemaVersion") != SCHEMA_VERSION:
        print(
            f"schemaVersion mismatch: catalogue={catalogue.get('schemaVersion')} "
            f"pydantic={SCHEMA_VERSION}",
            file=sys.stderr,
        )
        return 1

    missing = [k for k in catalogue.get("requiredTopLevelKeys", []) if k not in props]
    if missing:
        print(f"pydantic missing top-level keys: {missing}", file=sys.stderr)
        return 1

    engines = set(catalogue.get("extractorEngines", []))
    model_engines = set(get_args(ExtractorEngine))
    if engines != model_engines:
        print(
            f"extractorEngines drift: catalogue={sorted(engines)} "
            f"pydantic={sorted(model_engines)}",
            file=sys.stderr,
        )
        return 1

    catalogue_blocks = set(catalogue.get("blockTypes", []))
    model_blocks = set(get_args(BlockType))
    if catalogue_blocks != model_blocks:
        print(
            f"blockTypes drift: catalogue={sorted(catalogue_blocks)} "
            f"pydantic={sorted(model_blocks)}",
            file=sys.stderr,
        )
        return 1

    catalogue_flags = set(catalogue.get("sectionFlags", []))
    model_flags = set(get_args(SectionFlag))
    if catalogue_flags != model_flags:
        print(
            f"sectionFlags drift: catalogue={sorted(catalogue_flags)} "
            f"pydantic={sorted(model_flags)}",
            file=sys.stderr,
        )
        return 1

    section_props = Section.model_json_schema().get("properties") or {}
    if "flags" not in section_props:
        print("Section.flags missing from pydantic schema", file=sys.stderr)
        return 1

    print("OK: pydantic NormalizedDocument matches hand catalogue")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
