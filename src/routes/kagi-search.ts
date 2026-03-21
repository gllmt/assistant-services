import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";
import { createOpenClawWebSearchResponse } from "../integrations/openclaw/responses.js";
import { searchWithKagi } from "../services/kagi/client.js";
import { kagiSearchQuerySchema } from "../schemas/kagi-search.js";

export async function registerKagiSearchRoutes(server: FastifyInstance) {
  server.get("/kagi", async (request, reply) => {
    try {
      const query = kagiSearchQuerySchema.parse(request.query);

      if (!server.appConfig.KAGI_API_KEY) {
        throw new AppError("KAGI_API_KEY is not configured", 500);
      }

      const result = await searchWithKagi({
        apiKey: server.appConfig.KAGI_API_KEY,
        baseUrl: server.appConfig.KAGI_BASE_URL,
        query: query.q,
        count: query.count
      });

      return createOpenClawWebSearchResponse(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({
          error: error.name,
          message: error.message
        });
      }

      return reply.code(400).send({
        error: "BadRequest",
        message: error instanceof Error ? error.message : "Invalid request"
      });
    }
  });
}
