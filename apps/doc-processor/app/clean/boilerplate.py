"""Boilerplate / nav-like block removal."""

from __future__ import annotations

import re

from app.schema import Block, CleaningLogEntry

_NAV_PATTERNS = [
    re.compile(r"^(home|início|menu|navigation|skip to content)$", re.I),
    re.compile(r"^(cookies?|aceitar cookies|política de privacidade)$", re.I),
    re.compile(r"^(compartilhar|share on|siga-nos|follow us)$", re.I),
]


def strip_boilerplate_blocks(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    sample: str | None = None
    kept: list[Block] = []

    for block in blocks:
        text = block.text.strip()
        if _looks_like_boilerplate(text):
            removed += 1
            if sample is None:
                sample = text[:80]
            continue
        kept.append(block)

    return kept, CleaningLogEntry(step="html_boilerplate_strip", removed=removed, sample=sample)


def _link_char_ratio(text: str) -> float:
    """Approximate link-character share via URL-like spans (§13.1 link density)."""
    if not text:
        return 0.0
    link_chars = 0
    for m in re.finditer(r"https?://\S+|www\.\S+", text, re.I):
        link_chars += len(m.group(0))
    return link_chars / max(len(text), 1)


def _looks_like_boilerplate(text: str) -> bool:
    if any(p.match(text) for p in _NAV_PATTERNS):
        return True
    # Spec: link chars / total > 0.5 and block < 200 chars → boilerplate.
    if len(text) < 200 and _link_char_ratio(text) > 0.5:
        return True
    link_markers = text.count("http://") + text.count("https://") + text.count("www.")
    if link_markers >= 2 and len(text) < 160:
        return True
    alpha = sum(c.isalpha() for c in text)
    if len(text) > 0 and alpha / len(text) < 0.4 and len(text) < 200:
        return True
    return False
