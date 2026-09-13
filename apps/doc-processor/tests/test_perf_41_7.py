"""§41.7 performance smoke budgets for doc-processor."""

from __future__ import annotations

import base64
import time
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
ROOT = Path(__file__).resolve().parents[3]
KNOWLEDGE = ROOT / "fixtures" / "golden" / "knowledge"


def _html_payload(chars: int = 20_000) -> dict:
    body = ("<p>Texto educacional sobre concordancia verbal e licitacoes. </p>\n" * (chars // 60))
    html = f"<html><body><h1>Apostila</h1>{body}</body></html>".encode("utf-8")
    return {
        "documentId": "perf-html",
        "contentType": "text/html",
        "base64": base64.b64encode(html).decode("ascii"),
        "roleHint": "knowledge",
    }


def test_html_process_under_300ms():
    payload = _html_payload()
    t0 = time.perf_counter()
    res = client.post("/process", json=payload)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200, res.text
    assert elapsed_ms < 300, f"HTML process took {elapsed_ms:.1f}ms"


def test_pdf_text_layer_under_3s():
    path = KNOWLEDGE / "lei-14133-excerpt.pdf"
    if not path.is_file():
        return
    # Build a larger synthetic PDF by repeating the small golden bytes is weak;
    # budget applies to a real-ish single-page text PDF smoke.
    payload = {
        "documentId": "perf-pdf",
        "contentType": "application/pdf",
        "base64": base64.b64encode(path.read_bytes()).decode("ascii"),
        "roleHint": "knowledge",
    }
    t0 = time.perf_counter()
    res = client.post("/process", json=payload)
    elapsed = time.perf_counter() - t0
    assert res.status_code == 200, res.text
    assert elapsed < 3.0, f"PDF process took {elapsed:.2f}s"


def test_ocr_stub_under_60s():
    path = KNOWLEDGE / "scanned-page-ocr-stub.pdf"
    if not path.is_file():
        return
    payload = {
        "documentId": "perf-ocr",
        "contentType": "application/pdf",
        "base64": base64.b64encode(path.read_bytes()).decode("ascii"),
        "roleHint": "knowledge",
    }
    t0 = time.perf_counter()
    res = client.post("/process", json=payload)
    elapsed = time.perf_counter() - t0
    assert res.status_code == 200, res.text
    assert elapsed < 60.0, f"OCR stub process took {elapsed:.2f}s"
