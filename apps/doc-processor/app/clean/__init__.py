"""Deterministic text-level cleaning pipeline (§13.1)."""

from __future__ import annotations

from urllib.parse import urlparse

from app.clean.boilerplate import strip_boilerplate_blocks
from app.clean.encoding import normalize_encoding
from app.clean.garbage import drop_garbage_blocks
from app.clean.hyphenation import repair_hyphenation
from app.clean.language import flag_non_target_language
from app.clean.ligatures import fix_ligatures
from app.clean.minimum import enforce_minimum_content
from app.clean.page_artifacts import remove_page_artifacts, remove_page_number_patterns
from app.clean.repeated import strip_repeated_blocks
from app.clean.whitespace import collapse_whitespace
from app.schema import Block, CleaningLogEntry


def _domain_from_url(url: str | None) -> str | None:
    if not url:
        return None
    try:
        host = urlparse(url).hostname
        return host.lower() if host else None
    except Exception:
        return None


def run_cleaning_pipeline(
    blocks: list[Block],
    *,
    role_hint: str | None = None,
    document_id: str = "unknown",
    url: str | None = None,
) -> tuple[list[Block], list[CleaningLogEntry]]:
    log: list[CleaningLogEntry] = []
    current = blocks

    current, entry = normalize_encoding(current)
    log.append(entry)

    current, entry = fix_ligatures(current)
    log.append(entry)

    current, entry = repair_hyphenation(current)
    log.append(entry)

    current, entry = strip_boilerplate_blocks(current)
    log.append(entry)

    current, entry = remove_page_number_patterns(current)
    log.append(entry)

    current, entry = remove_page_artifacts(current)
    log.append(entry)

    current, entry = drop_garbage_blocks(current)
    log.append(entry)

    current, entry = flag_non_target_language(current)
    log.append(entry)

    current, entry = strip_repeated_blocks(
        current,
        domain=_domain_from_url(url),
        document_id=document_id,
    )
    log.append(entry)

    current, entry = collapse_whitespace(current)
    log.append(entry)

    current, entry = enforce_minimum_content(current, role_hint=role_hint)
    log.append(entry)

    return current, log
