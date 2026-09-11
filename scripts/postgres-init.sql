-- Concept: Ingestion + Question bank / Embeddings (local Postgres bootstrap)
CREATE DATABASE quizzeira_discovery;
CREATE DATABASE quizzeira_content;
\c quizzeira_content
CREATE EXTENSION IF NOT EXISTS vector;
