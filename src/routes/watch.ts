import type { FastifyInstance } from "fastify";

export async function registerWatchRoutes(server: FastifyInstance) {
  server.get("/watch", async () => {
    return {
      ok: true,
      provider: "watch",
      status: "not_implemented"
    };
  });
}
