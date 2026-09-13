"""§33: per-document work is bounded (page cap, OCR skip) so one huge scan cannot starve the service."""

import fitz

from app.extract.pdf import extract_pdf
from app.processor import _try_ocr_pdf


def _pdf_with_pages(n: int) -> bytes:
    doc = fitz.open()
    for i in range(n):
        page = doc.new_page()
        page.insert_text((72, 72), f"Pagina {i + 1} conteudo programatico " * 5)
    data = doc.tobytes()
    doc.close()
    return data


def test_extract_pdf_respects_max_pages(monkeypatch):
    monkeypatch.setenv("DOC_PROCESSOR_MAX_PAGES", "2")
    result = extract_pdf(_pdf_with_pages(5))
    assert result.pages == 5
    assert {b.page for b in result.blocks if b.page} == {1, 2}


def test_ocr_skipped_on_long_documents(monkeypatch):
    monkeypatch.setenv("DOC_PROCESSOR_OCR_SKIP_ABOVE_PAGES", "3")
    blocks, conf = _try_ocr_pdf(_pdf_with_pages(5))
    assert blocks == [] and conf is None
