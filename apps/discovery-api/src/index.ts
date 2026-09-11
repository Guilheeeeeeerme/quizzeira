// Concept: Ingestion (API surface for Source registry + Document store)
import Fastify from "fastify";
import { env } from "./lib/env";
import { registerInternalRoutes } from "./routes/internal";
import { registerAdminRoutes } from "./routes/admin";

async function bootstrap() {
  const app = Fastify({ logger: true });
  app.get("/health", async () => ({ ok: true, service: "discovery-api" }));
  await registerInternalRoutes(app);
  await registerAdminRoutes(app);
  await app.listen({ port: env.port, host: "0.0.0.0" });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
