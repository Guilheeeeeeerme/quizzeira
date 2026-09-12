"""Optional lingua language detection — soft dependency (§13.1)."""

from __future__ import annotations


def detect_language_lingua(text: str) -> str | None:
    """Return ISO-ish code when lingua is installed; else None."""
    sample = (text or "").strip()
    if len(sample) < 40:
        return None
    try:
        from lingua import Language, LanguageDetectorBuilder  # type: ignore
    except ImportError:
        return None

    try:
        detector = LanguageDetectorBuilder.from_languages(
            Language.PORTUGUESE,
            Language.ENGLISH,
            Language.SPANISH,
        ).build()
        lang = detector.detect_language_of(sample[:4000])
        if lang is None:
            return None
        mapping = {
            Language.PORTUGUESE: "pt",
            Language.ENGLISH: "en",
            Language.SPANISH: "es",
        }
        return mapping.get(lang)
    except Exception:
        return None
