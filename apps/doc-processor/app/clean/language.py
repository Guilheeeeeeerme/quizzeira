"""Lightweight language flagging (§13.1). Prefer lingua when installed."""

from __future__ import annotations

import re

from app.clean.lingua_detect import detect_language_lingua
from app.schema import Block, CleaningLogEntry

_PT = re.compile(
    r"\b(de|da|do|para|com|não|questão|prova|concurso|edital|direito|administração)\b",
    re.I,
)
_EN = re.compile(r"\b(the|and|for|with|question|exam|which|their)\b", re.I)
_ES = re.compile(r"\b(el|los|las|una|para|concurso|derecho|según)\b", re.I)


def flag_non_target_language(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    """Count non-pt/en blocks; text is kept (eligibility rejects later)."""
    flagged = 0
    method = "heuristic"
    for block in blocks:
        sample = block.text[:2000]
        lingua = detect_language_lingua(sample)
        if lingua is not None:
            method = "lingua"
            if lingua not in ("pt", "en"):
                flagged += 1
            continue
        pt = len(_PT.findall(sample))
        en = len(_EN.findall(sample))
        es = len(_ES.findall(sample))
        if es > pt + 2 and es > en + 2:
            flagged += 1
    return blocks, CleaningLogEntry(
        step="language_flag",
        removed=flagged,
        sample=f"{method}:non_target:{flagged}" if flagged else method,
    )
