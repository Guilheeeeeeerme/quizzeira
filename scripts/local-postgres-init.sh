#!/bin/bash
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'quizzeira') THEN
      CREATE ROLE quizzeira LOGIN PASSWORD 'quizzeira';
    END IF;
  END \$\$;
  SELECT 'CREATE DATABASE quizzeira_discovery OWNER quizzeira'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'quizzeira_discovery')\gexec
  SELECT 'CREATE DATABASE quizzeira_content OWNER quizzeira'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'quizzeira_content')\gexec
EOSQL
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d quizzeira_content -c 'CREATE EXTENSION IF NOT EXISTS vector;'
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d quizzeira_discovery -c 'CREATE EXTENSION IF NOT EXISTS vector;'
