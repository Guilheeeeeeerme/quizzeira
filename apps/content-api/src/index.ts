// Concept: Question bank (API surface for Extraction, Generation, Eval, Study)
import Fastify from "fastify";
import { env } from "./lib/env";
import { registerAdminRoutes } from "./routes/admin";
import { registerInternalRoutes } from "./routes/internal";
import { registerPublishedRoutes } from "./routes/published";

async function main(): Promise<void> {
  // Bodies carry base64 PDFs and embedding arrays, so the default 1MB limit is
  // far too small here.
  const app = Fastify({ logger: true, bodyLimit: 32 * 1024 * 1024 });

  app.get("/health", async () => ({ ok: true, service: "content-api" }));

  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) app.log.error(error);
    reply.code(status).send({ error: (error as Error).message });
  });

  await registerInternalRoutes(app);
  await registerPublishedRoutes(app);
  await registerAdminRoutes(app);

  await app.listen({ port: env.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
