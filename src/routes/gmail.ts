import type { FastifyInstance } from "fastify";

export async function registerGmailRoutes(server: FastifyInstance) {
  server.get("/gmail", async () => {
    return {
      ok: true,
      provider: "gmail",
      status: "not_implemented"
    };
  });
}
