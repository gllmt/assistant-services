import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(server: FastifyInstance) {
  server.get("/health", async () => {
    return {
      ok: true,
      service: "openclaw-extensions",
      timestamp: new Date().toISOString()
    };
  });
}
