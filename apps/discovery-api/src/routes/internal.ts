// Concept: Ingestion (crawler-facing write surface)
//
// discovery-crawler is the only caller. It never touches the study API, and the
// study API never writes here — Discovery owns Source registry + Document store.
import type { FastifyInstance } from "fastify";
import { assertInternal } from "./internal/helpers";
import { registerInternalSourceRoutes } from "./internal/sources";
import { registerInternalExamRoutes } from "./internal/exams";
import { registerInternalArtifactRoutes } from "./internal/artifacts";
import { registerInternalTopicQueryRoutes } from "./internal/topic-queries";
import { registerInternalDomainStatsRoutes } from "./internal/domain-stats";
import { registerInternalRunRoutes } from "./internal/runs";

export async function registerInternalRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/internal")) assertInternal(request);
  });

  await registerInternalSourceRoutes(app);
  await registerInternalExamRoutes(app);
  await registerInternalArtifactRoutes(app);
  await registerInternalTopicQueryRoutes(app);
  await registerInternalDomainStatsRoutes(app);
  await registerInternalRunRoutes(app);
}
