-- The OAB source cannot be crawled as a generic listing: oab.fgv.br renders its
-- document list only after an ASP.NET postback. See docs/oab-exam.md.
ALTER TYPE "CrawlStrategy" ADD VALUE IF NOT EXISTS 'oab_fgv';
