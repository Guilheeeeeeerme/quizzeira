FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-por libreoffice-writer-nogui \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY apps/doc-processor/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY apps/doc-processor/app /app/app

ENV PYTHONUNBUFFERED=1
ENV DOC_PROCESSOR_OCR=false
EXPOSE 3040
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3040"]
