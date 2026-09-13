FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    tesseract-ocr \
    tesseract-ocr-por \
    libreoffice-writer-nogui \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY tests ./tests

ENV PYTHONUNBUFFERED=1
ENV PORT=3030

EXPOSE 3030

HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=15s \
  CMD curl -fsS http://127.0.0.1:3030/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3030"]
