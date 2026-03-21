import type { FastifyInstance } from "fastify";

export async function registerNotionRoutes(server: FastifyInstance) {
  server.get("/notion", async () => {
    return {
      ok: true,
      provider: "notion",
      status: "not_implemented"
    };
  });
}
