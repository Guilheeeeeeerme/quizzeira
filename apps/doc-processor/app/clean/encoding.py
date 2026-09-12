"""Encoding normalization: NFC, mojibake repair, quote/dash unification."""

from __future__ import annotations

import unicodedata

from app.schema import Block, CleaningLogEntry


def normalize_encoding(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    sample: str | None = None
    cleaned: list[Block] = []

    for block in blocks:
        text = block.text
        original = text

        text = unicodedata.normalize("NFC", text)
        text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
        text = text.replace("\u201c", '"').replace("\u201d", '"')
        text = text.replace("\u2018", "'").replace("\u2019", "'")
        text = text.replace("\u2013", "-").replace("\u2014", "-")
        text = text.replace("\ufb01", "fi").replace("\ufb02", "fl")

        try:
            import ftfy

            fixed = ftfy.fix_text(text)
            text = fixed
        except ImportError:
            pass

        if text != original:
            removed += len(original) - len(text)
            if sample is None and original != text:
                sample = original[:80]

        if text.strip():
            cleaned.append(block.model_copy(update={"text": text}))

    return cleaned, CleaningLogEntry(step="encoding_normalization", removed=max(0, removed), sample=sample)
