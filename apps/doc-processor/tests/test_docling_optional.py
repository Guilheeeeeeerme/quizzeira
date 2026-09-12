"""Smoke test: Docling helper is optional and safe when missing."""

from app.extract.docling_pdf import docling_available, extract_with_docling


def test_docling_helper_does_not_crash_without_extra():
    # Without the optional dependency this returns False / None.
    assert isinstance(docling_available(), bool)
    assert extract_with_docling(b"%PDF-1.4", filename="empty.pdf") is None or docling_available()
