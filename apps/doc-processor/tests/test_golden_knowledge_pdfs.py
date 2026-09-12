"""Golden knowledge PDFs from fixtures/golden/knowledge (§42)."""

from __future__ import annotations

import base64
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ROOT = Path(__file__).resolve().parents[3]
KNOWLEDGE = ROOT / "fixtures" / "golden" / "knowledge"

PDFS = [
    ("grammar-chapter.pdf", "knowledge"),
    ("lei-14133-excerpt.pdf", "knowledge"),
    ("math-porcentagem.pdf", "knowledge"),
    ("manual-etica.pdf", "knowledge"),
    ("scanned-page-ocr-stub.pdf", "knowledge"),
]


@pytest.mark.parametrize("name,role", PDFS)
def test_golden_knowledge_pdf_process(name: str, role: str):
    path = KNOWLEDGE / name
    if not path.is_file():
        pytest.skip(f"missing {path}")
    payload = {
        "documentId": f"golden-{path.stem}",
        "contentType": "application/pdf",
        "base64": base64.b64encode(path.read_bytes()).decode("ascii"),
        "url": f"https://fixture.local/knowledge/{name}",
        "roleHint": role,
    }
    res = client.post("/process", json=payload)
    assert res.status_code == 200, res.text
    doc = res.json()
    assert doc["schemaVersion"] == "1"
    assert doc["extractor"]["engine"] in (
        "pymupdf",
        "docling",
        "plain",
        "pdf-unavailable",
    )
    assert isinstance(doc["sections"], list)
    assert isinstance(doc["blocks"], list)
    # Text-layer PDFs should recover some chars; OCR stub may be thin.
    if "ocr-stub" not in name:
        assert doc["stats"]["chars"] > 20, doc["stats"]
    else:
        assert doc["stats"]["chars"] >= 0
