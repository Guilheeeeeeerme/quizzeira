// Concept: Ingestion (API surface for Source registry + Document store)
import Fastify from "fastify";
import { env } from "./lib/env";
import { registerInternalRoutes } from "./routes/internal";
import { registerAdminRoutes } from "./routes/admin";

async function bootstrap() {
  // Artifacts arrive as base64 JSON; a 920 KB edital PDF exceeds Fastify's
  // 1 MiB default and was dropped with 413. Matches content-api.
  const app = Fastify({ logger: true, bodyLimit: 32 * 1024 * 1024 });
  app.get("/health", async () => ({ ok: true, service: "discovery-api" }));
  await registerInternalRoutes(app);
  await registerAdminRoutes(app);
  await app.listen({ port: env.port, host: "0.0.0.0" });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
