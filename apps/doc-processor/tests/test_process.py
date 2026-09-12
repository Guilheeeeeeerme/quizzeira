from app.detect import detect_format
from app.processor import process_bytes


def test_detect_html_and_pdf_magic():
    assert detect_format(b"<html><body>hi</body></html>", "text/html") == "html"
    assert detect_format(b"%PDF-1.4....", "application/pdf") == "pdf"


def test_process_plain_text():
    raw = ("LÍNGUA PORTUGUESA\n\n" + ("Concordância verbal e nominal. " * 40)).encode()
    doc = process_bytes(raw, document_id="t1", source_url=None, content_type="text/plain")
    assert doc.schemaVersion == "1"
    assert doc.stats["chars"] >= 400
    assert doc.sections
