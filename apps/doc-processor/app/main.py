"""Quizzeira doc-processor — FastAPI entrypoint (§12, §38)."""
from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from .processor import process_bytes
from .schema import NormalizedDocument

APP_VERSION = "0.1.0"

app = FastAPI(title="quizzeira-doc-processor", version=APP_VERSION)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "doc-processor"}


@app.get("/version")
def version() -> dict[str, Any]:
    return {
        "version": APP_VERSION,
        "engines": ["plain", "html", "pymupdf", "python-docx", "ebooklib"],
        "ocr": os.environ.get("DOC_PROCESSOR_OCR", "false") == "true",
    }


@app.post("/process")
async def process(
    file: UploadFile = File(...),
    document_id: str = Form("unknown"),
    source_url: str | None = Form(None),
    content_type: str | None = Form(None),
    role_hint: str | None = Form(None),
    enable_ocr: bool = Form(False),
) -> JSONResponse:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty_body")
    max_bytes = int(os.environ.get("DOC_PROCESSOR_MAX_BYTES", str(16 * 1024 * 1024)))
    if len(raw) > max_bytes:
        raise HTTPException(status_code=413, detail="too_large")
    try:
        doc: NormalizedDocument = process_bytes(
            raw,
            document_id=document_id,
            source_url=source_url,
            content_type=content_type or file.content_type,
            role_hint=role_hint,
            enable_ocr=enable_ocr,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return JSONResponse(doc.model_dump())
