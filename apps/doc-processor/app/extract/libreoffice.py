"""LibreOffice headless conversion for legacy Office formats (§12.1)."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from app.detect import DocumentFormat


def libreoffice_available() -> bool:
    return shutil.which("libreoffice") is not None or shutil.which("soffice") is not None


def convert_with_libreoffice(data: bytes, fmt: DocumentFormat) -> bytes | None:
    """Convert DOC/PPT/PPTX/DOCX → DOCX or PDF bytes when LibreOffice is installed."""
    if not libreoffice_available():
        return None

    binary = shutil.which("libreoffice") or shutil.which("soffice")
    if not binary:
        return None

    suffix = {
        DocumentFormat.DOC: ".doc",
        DocumentFormat.DOCX: ".docx",
        DocumentFormat.PPT: ".ppt",
        DocumentFormat.PPTX: ".pptx",
        DocumentFormat.EPUB: ".epub",
    }.get(fmt)
    if not suffix:
        return None

    # Prefer DOCX for Word; PDF for slides/ebooks.
    target = "docx" if fmt in (DocumentFormat.DOC, DocumentFormat.DOCX) else "pdf"

    try:
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / f"input{suffix}"
            src.write_bytes(data)
            proc = subprocess.run(
                [
                    binary,
                    "--headless",
                    "--convert-to",
                    target,
                    "--outdir",
                    tmp,
                    str(src),
                ],
                capture_output=True,
                timeout=60,
                check=False,
            )
            if proc.returncode != 0:
                return None
            out = Path(tmp) / f"input.{target}"
            if not out.exists():
                return None
            return out.read_bytes()
    except Exception:
        return None
