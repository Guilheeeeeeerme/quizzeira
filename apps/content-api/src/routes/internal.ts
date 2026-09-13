// Concept: Extraction + Generation + Question bank (worker-facing write surface)
//
// Callers: content-worker (extraction, embeddings, generation) and
// content-quality (Eval verdicts). Nothing here can be reached from the web.
import type { FastifyInstance } from "fastify";
import { assertInternal } from "./internal/helpers";
import { registerInternalDocumentRoutes } from "./internal/documents";
import { registerInternalSyllabusRoutes } from "./internal/syllabus";
import { registerInternalKnowledgeRoutes } from "./internal/knowledge";
import { registerInternalEvidenceRoutes } from "./internal/evidence";
import { registerInternalGenerationRoutes } from "./internal/generation";
import { registerInternalQualityRoutes } from "./internal/quality";
import { registerInternalProvenanceRoutes } from "./internal/provenance";

export async function registerInternalRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/internal")) assertInternal(request);
  });

  await registerInternalDocumentRoutes(app);
  await registerInternalSyllabusRoutes(app);
  await registerInternalKnowledgeRoutes(app);
  await registerInternalEvidenceRoutes(app);
  await registerInternalGenerationRoutes(app);
  await registerInternalQualityRoutes(app);
  await registerInternalProvenanceRoutes(app);
}
