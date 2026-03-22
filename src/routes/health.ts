import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(server: FastifyInstance) {
  server.get("/health", async () => {
    return {
      ok: true,
      service: "assistant-services",
      timestamp: new Date().toISOString()
    };
  });
}
