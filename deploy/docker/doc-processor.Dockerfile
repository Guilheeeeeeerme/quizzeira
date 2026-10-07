# Quizzeira document processor (apps/doc-processor) — FastAPI, PDF/HTML/DOCX →
# cleaned text with tesseract (pt-BR) + LibreOffice (nogui). Faithful port of
# infra containers/quizzeira/doc-processor.Dockerfile, python:3.12-slim-bookworm base.
# syntax=docker/dockerfile:1
FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    tesseract-ocr-por \
    libreoffice-writer-nogui \
    && rm -rf /var/lib/apt/lists/*

COPY apps/doc-processor/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/doc-processor/app ./app

ARG GIT_SHA=""
ENV PYTHONUNBUFFERED=1 \
    PORT=3030 \
    HOME=/tmp \
    GIT_SHA=${GIT_SHA}

EXPOSE 3030

HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=30s \
  CMD curl -fsS http://127.0.0.1:3030/health || exit 1

USER 10001:10001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3030"]
