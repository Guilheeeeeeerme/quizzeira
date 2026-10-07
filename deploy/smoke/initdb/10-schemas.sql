-- runner smoke init: create the three plane schemas inside the default db.
-- The extension `vector` is provided by the pgvector image used in
-- compose.smoke.yml; content-api's first migration runs CREATE EXTENSION itself.
CREATE SCHEMA IF NOT EXISTS quizzeira_study;
CREATE SCHEMA IF NOT EXISTS quizzeira_discovery;
CREATE SCHEMA IF NOT EXISTS quizzeira_content;
