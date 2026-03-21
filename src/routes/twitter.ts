import type { FastifyInstance } from "fastify";

export async function registerTwitterRoutes(server: FastifyInstance) {
  server.get("/twitter", async () => {
    return {
      ok: true,
      provider: "twitter",
      status: "not_implemented"
    };
  });
}
