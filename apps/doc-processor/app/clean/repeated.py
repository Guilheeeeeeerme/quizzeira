"""Repeated-block removal via domain-level shingle cache (§13.1)."""

from __future__ import annotations

import hashlib
import re
from collections import defaultdict

from app.schema import Block, CleaningLogEntry

# Process-local cache: domain → normalised block hash → doc ids seen.
_DOMAIN_SHINGLES: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))

_WS = re.compile(r"\s+")


def reset_domain_shingle_cache() -> None:
    """Test helper."""
    _DOMAIN_SHINGLES.clear()


def _norm(text: str) -> str:
    return _WS.sub(" ", text.strip().lower())


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:24]


def strip_repeated_blocks(
    blocks: list[Block],
    *,
    domain: str | None,
    document_id: str,
) -> tuple[list[Block], CleaningLogEntry]:
    """
    Drop blocks whose normalised text already appeared in ≥3 docs from the same domain.
    Also records this document's block hashes for future documents.
    """
    if not domain:
        return blocks, CleaningLogEntry(step="repeated_block_removal", removed=0)

    cache = _DOMAIN_SHINGLES[domain.lower()]
    removed = 0
    sample: str | None = None
    kept: list[Block] = []

    for block in blocks:
        if block.type in ("heading", "table"):
            kept.append(block)
            continue
        norm = _norm(block.text)
        if len(norm) < 40:
            kept.append(block)
            continue
        key = _hash(norm)
        seen_docs = cache[key]
        # Count other documents that already had this block.
        other_count = len(seen_docs - {document_id})
        if other_count >= 3:
            removed += 1
            if sample is None:
                sample = block.text[:80]
            continue
        seen_docs.add(document_id)
        kept.append(block)

    return kept, CleaningLogEntry(
        step="repeated_block_removal",
        removed=removed,
        sample=sample,
    )
