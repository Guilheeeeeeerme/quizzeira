from __future__ import annotations

from ..schema import CleaningLogEntry


def detect_language(text: str) -> tuple[str, CleaningLogEntry]:
    sample = text[:4000].lower()
    pt_hits = sum(sample.count(w) for w in ("ção", "ões", "não", "para", "com", "uma", "que"))
    en_hits = sum(sample.count(w) for w in (" the ", " and ", " of ", " to ", " in "))
    lang = "pt" if pt_hits >= en_hits else "en" if en_hits > 3 else "pt"
    try:
        from lingua import Language, LanguageDetectorBuilder  # type: ignore

        detector = LanguageDetectorBuilder.from_languages(Language.PORTUGUESE, Language.ENGLISH).build()
        detected = detector.detect_language_of(sample)
        if detected == Language.PORTUGUESE:
            lang = "pt"
        elif detected == Language.ENGLISH:
            lang = "en"
    except Exception:
        pass
    return lang, CleaningLogEntry(step="language", removed=0, sample=lang)
