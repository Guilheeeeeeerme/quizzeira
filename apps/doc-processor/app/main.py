"""FastAPI surface: POST /process, GET /health, GET /version."""

from __future__ import annotations

import base64
import shutil
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app import __version__
from app.processor import process_document
from app.schema import NormalizedDocument, ProcessJsonRequest

app = FastAPI(title="Quizzeira doc-processor", version=__version__)


def _engine_status() -> list[str]:
    engines: list[str] = ["plain"]

    try:
        import fitz  # noqa: F401

        engines.append("pymupdf")
    except ImportError:
        pass

    try:
        import trafilatura  # noqa: F401

        engines.append("trafilatura")
    except ImportError:
        pass

    try:
        import docx  # noqa: F401

        engines.append("python-docx")
    except ImportError:
        pass

    try:
        import docling  # noqa: F401

        engines.append("docling")
    except ImportError:
        pass

    if shutil.which("tesseract"):
        engines.append("tesseract")

    if shutil.which("libreoffice") or shutil.which("soffice"):
        engines.append("libreoffice")

    return sorted(set(engines))


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "engines": _engine_status()}


@app.get("/version")
def version() -> dict[str, Any]:
    return {"version": __version__, "engines": _engine_status()}


@app.post("/process", response_model=NormalizedDocument)
async def process_endpoint(request: Request) -> NormalizedDocument:
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if isinstance(upload, UploadFile):
            data = await upload.read()
            doc_id = str(form.get("documentId") or "unknown")
            ct = str(form.get("contentType") or upload.content_type or "application/octet-stream")
            url = str(form.get("url")) if form.get("url") else None
            role_hint = str(form.get("roleHint")) if form.get("roleHint") else None
            return process_document(
                data,
                document_id=doc_id,
                content_type=ct,
                url=url,
                role_hint=role_hint,
            )

    body = await request.json()
    if isinstance(body, dict):
        payload = ProcessJsonRequest.model_validate(body)
        b64 = payload.base64 or payload.bytesBase64
        if not b64:
            raise HTTPException(status_code=422, detail="base64 or bytesBase64 required")
        try:
            data = base64.b64decode(b64, validate=True)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"invalid base64: {exc}") from exc

        return process_document(
            data,
            document_id=payload.documentId,
            content_type=payload.contentType,
            url=payload.url,
            role_hint=payload.roleHint,
        )

    raise HTTPException(status_code=422, detail="expected multipart file or JSON body")


@app.post("/process/upload", response_model=NormalizedDocument)
async def process_upload(
    file: UploadFile = File(...),
    documentId: str = Form("unknown"),
    contentType: str | None = Form(None),
    url: str | None = Form(None),
    roleHint: str | None = Form(None),
) -> NormalizedDocument:
    data = await file.read()
    return process_document(
        data,
        document_id=documentId,
        content_type=contentType or file.content_type or "application/octet-stream",
        url=url,
        role_hint=roleHint,
    )


@app.exception_handler(ValueError)
async def value_error_handler(_request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"error": "corrupt", "detail": str(exc)})
